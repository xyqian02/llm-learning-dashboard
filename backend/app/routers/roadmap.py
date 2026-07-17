from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models.roadmap import RoadmapNode, LearningProgress
from app.models.note import Note
from app.models.bookmark import Bookmark
from app.schemas.roadmap import (
    RoadmapNodeInTree,
    RoadmapNodeDetail,
    RoadmapNodeCreate,
    RoadmapNodeUpdate,
    ProgressSchema,
    ProgressUpdate,
    SortUpdate,
)

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


def build_tree(nodes: List[RoadmapNode], parent_id: int | None = None) -> List[RoadmapNodeInTree]:
    """递归构建树形结构"""
    children_nodes = [n for n in nodes if n.parent_id == parent_id]
    children_nodes.sort(key=lambda n: n.sort_order)

    result = []
    for node in children_nodes:
        status = "not_started"
        if node.progress is not None:
            status = node.progress.status

        node_in_tree = RoadmapNodeInTree(
            id=node.id,
            parent_id=node.parent_id,
            title=node.title,
            description=node.description,
            sort_order=node.sort_order,
            stage=node.stage,
            depth=node.depth,
            icon=node.icon,
            status=status,
            children=build_tree(nodes, node.id),
        )
        result.append(node_in_tree)
    return result


@router.get("/tree", response_model=List[RoadmapNodeInTree])
def get_roadmap_tree(db: Session = Depends(get_db)):
    """获取完整路线树"""
    nodes = db.query(RoadmapNode).order_by(RoadmapNode.sort_order).all()
    return build_tree(nodes, parent_id=None)


@router.get("/nodes/{node_id}", response_model=RoadmapNodeDetail)
def get_node_detail(node_id: int, db: Session = Depends(get_db)):
    """获取节点详情，包含 progress、关联笔记和收藏"""
    node = db.query(RoadmapNode).filter(RoadmapNode.id == node_id).first()
    if node is None:
        raise HTTPException(status_code=404, detail="节点不存在")

    status = "not_started"
    progress = None
    if node.progress is not None:
        status = node.progress.status
        progress = ProgressSchema.model_validate(node.progress)

    linked_notes = [
        {"id": note.id, "title": note.title}
        for note in node.notes
    ]
    linked_bookmarks = [
        {"id": bm.id, "title": bm.title, "type": bm.type, "url": bm.url}
        for bm in node.bookmarks
    ]

    return RoadmapNodeDetail(
        id=node.id,
        parent_id=node.parent_id,
        title=node.title,
        description=node.description,
        sort_order=node.sort_order,
        stage=node.stage,
        depth=node.depth,
        icon=node.icon,
        status=status,
        children=[],
        progress=progress,
        linked_notes=linked_notes,
        linked_bookmarks=linked_bookmarks,
    )


@router.post("/nodes", response_model=RoadmapNodeInTree, status_code=201)
def create_node(data: RoadmapNodeCreate, db: Session = Depends(get_db)):
    """创建新节点，自动计算 depth、继承 stage，并生成初始进度记录"""
    depth = 0
    stage = data.stage

    if data.parent_id is not None:
        parent = db.query(RoadmapNode).filter(RoadmapNode.id == data.parent_id).first()
        if parent is None:
            raise HTTPException(status_code=404, detail="父节点不存在")
        depth = parent.depth + 1
        if stage is None:
            stage = parent.stage

    node = RoadmapNode(
        parent_id=data.parent_id,
        title=data.title,
        description=data.description,
        sort_order=data.sort_order,
        stage=stage,
        depth=depth,
        icon=data.icon,
    )
    db.add(node)
    db.flush()  # 获取 node.id

    progress = LearningProgress(node_id=node.id, status="not_started")
    db.add(progress)
    db.commit()
    db.refresh(node)

    return RoadmapNodeInTree(
        id=node.id,
        parent_id=node.parent_id,
        title=node.title,
        description=node.description,
        sort_order=node.sort_order,
        stage=node.stage,
        depth=node.depth,
        icon=node.icon,
        status="not_started",
        children=[],
    )


@router.put("/nodes/{node_id}", response_model=RoadmapNodeInTree)
def update_node(node_id: int, data: RoadmapNodeUpdate, db: Session = Depends(get_db)):
    """更新节点（仅更新提供的字段）"""
    node = db.query(RoadmapNode).filter(RoadmapNode.id == node_id).first()
    if node is None:
        raise HTTPException(status_code=404, detail="节点不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(node, key, value)

    db.commit()
    db.refresh(node)

    status = "not_started"
    if node.progress is not None:
        status = node.progress.status

    return RoadmapNodeInTree(
        id=node.id,
        parent_id=node.parent_id,
        title=node.title,
        description=node.description,
        sort_order=node.sort_order,
        stage=node.stage,
        depth=node.depth,
        icon=node.icon,
        status=status,
        children=[],
    )


@router.delete("/nodes/{node_id}", status_code=204)
def delete_node(node_id: int, db: Session = Depends(get_db)):
    """删除节点（级联删除所有子节点）"""
    node = db.query(RoadmapNode).filter(RoadmapNode.id == node_id).first()
    if node is None:
        raise HTTPException(status_code=404, detail="节点不存在")

    db.delete(node)
    db.commit()


@router.put("/nodes/{node_id}/progress", response_model=ProgressSchema)
def update_progress(node_id: int, data: ProgressUpdate, db: Session = Depends(get_db)):
    """更新学习状态，自动记录 started_at 和 completed_at"""
    if data.status not in ("not_started", "in_progress", "completed"):
        raise HTTPException(status_code=400, detail="status 必须为 not_started、in_progress 或 completed")

    node = db.query(RoadmapNode).filter(RoadmapNode.id == node_id).first()
    if node is None:
        raise HTTPException(status_code=404, detail="节点不存在")

    progress = db.query(LearningProgress).filter(LearningProgress.node_id == node_id).first()
    if progress is None:
        progress = LearningProgress(node_id=node_id)
        db.add(progress)
        db.flush()

    now = datetime.now(timezone.utc)
    progress.status = data.status

    if data.status == "in_progress" and progress.started_at is None:
        progress.started_at = now
    if data.status == "completed":
        progress.completed_at = now

    db.commit()
    db.refresh(progress)

    return ProgressSchema.model_validate(progress)


@router.put("/nodes/{node_id}/sort")
def update_sort(node_id: int, data: SortUpdate, db: Session = Depends(get_db)):
    """更新节点排序"""
    node = db.query(RoadmapNode).filter(RoadmapNode.id == node_id).first()
    if node is None:
        raise HTTPException(status_code=404, detail="节点不存在")

    node.sort_order = data.sort_order
    db.commit()

    return {"message": "排序已更新", "node_id": node_id, "sort_order": data.sort_order}
