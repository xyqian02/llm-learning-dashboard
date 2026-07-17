from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models.note import Note, note_node_links, note_tags
from app.models.roadmap import RoadmapNode
from app.models.tag import Tag
from app.schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteListItem,
    NoteDetail,
    TagSchema,
    LinkedNodeInfo,
)

router = APIRouter(prefix="/api/notes", tags=["notes"])


def _build_note_detail(note: Note) -> NoteDetail:
    """将 Note ORM 对象转换为 NoteDetail"""
    return NoteDetail(
        id=note.id,
        title=note.title,
        content=note.content,
        linked_nodes=[
            LinkedNodeInfo(id=node.id, title=node.title, stage=node.stage)
            for node in note.linked_nodes
        ],
        tags=[
            TagSchema(id=t.id, name=t.name, color=t.color)
            for t in note.tags
        ],
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.get("/", response_model=dict)
def list_notes(
    search: Optional[str] = Query(None, description="搜索关键词（模糊匹配标题和内容）"),
    tag_id: Optional[int] = Query(None, description="按标签筛选"),
    sort: Optional[str] = Query("updated_at", description="排序字段: updated_at 或 title"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    """获取笔记列表，支持搜索、按标签筛选和分页"""
    query = db.query(Note)

    # 按标签筛选
    if tag_id is not None:
        query = query.join(Note.tags).filter(Tag.id == tag_id)

    # 模糊搜索
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Note.title.ilike(search_pattern),
                Note.content.ilike(search_pattern),
            )
        )

    # 排序
    if sort == "title":
        query = query.order_by(Note.title.asc(), Note.updated_at.desc())
    else:
        query = query.order_by(Note.updated_at.desc())

    # 计数
    total = query.count()

    # 分页
    notes = (
        query.options(joinedload(Note.tags))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for note in notes:
        preview = note.content[:150] if note.content else ""
        items.append(
            NoteListItem(
                id=note.id,
                title=note.title,
                content_preview=preview,
                tags=[
                    TagSchema(id=t.id, name=t.name, color=t.color)
                    for t in note.tags
                ],
                updated_at=note.updated_at,
            )
        )

    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{note_id}", response_model=NoteDetail)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """获取笔记详情"""
    note = (
        db.query(Note)
        .options(joinedload(Note.linked_nodes), joinedload(Note.tags))
        .filter(Note.id == note_id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return _build_note_detail(note)


@router.post("/", response_model=NoteDetail, status_code=201)
def create_note(data: NoteCreate, db: Session = Depends(get_db)):
    """创建笔记"""
    note = Note(title=data.title, content=data.content)
    db.add(note)
    db.flush()  # 获取 note.id

    # 关联节点
    if data.linked_node_ids:
        _link_nodes(db, note.id, data.linked_node_ids)

    # 关联标签
    if data.tag_ids:
        _link_tags(db, note.id, data.tag_ids)

    db.commit()
    db.refresh(note)
    return _build_note_detail(note)


@router.put("/{note_id}", response_model=NoteDetail)
def update_note(note_id: int, data: NoteUpdate, db: Session = Depends(get_db)):
    """更新笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")

    # 更新基本字段
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content

    # 更新节点关联：如果传入 None（默认），不修改；如果传入 []，清空关联；否则替换
    if data.linked_node_ids is not None:
        db.execute(
            note_node_links.delete().where(note_node_links.c.note_id == note_id)
        )
        if data.linked_node_ids:
            _link_nodes(db, note_id, data.linked_node_ids)

    # 更新标签关联
    if data.tag_ids is not None:
        db.execute(
            note_tags.delete().where(note_tags.c.note_id == note_id)
        )
        if data.tag_ids:
            _link_tags(db, note_id, data.tag_ids)

    db.commit()
    db.refresh(note)
    return _build_note_detail(note)


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """删除笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    db.delete(note)
    db.commit()
    return None


def _link_nodes(db: Session, note_id: int, node_ids: list):
    """批量插入笔记↔节点关联"""
    for nid in node_ids:
        db.execute(
            note_node_links.insert().values(note_id=note_id, node_id=nid)
        )


def _link_tags(db: Session, note_id: int, tag_ids: list):
    """批量插入笔记↔标签关联"""
    for tid in tag_ids:
        db.execute(
            note_tags.insert().values(note_id=note_id, tag_id=tid)
        )
