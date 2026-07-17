from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.database import get_db
from app.models.bookmark import Bookmark, bookmark_node_links, bookmark_tags
from app.models.tag import Tag
from app.schemas.bookmark import (
    BookmarkCreate,
    BookmarkUpdate,
    BookmarkListItem,
    BookmarkDetail,
)
from app.schemas.note import LinkedNodeInfo

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


def _build_bookmark_detail(bm: Bookmark) -> BookmarkDetail:
    """将 Bookmark ORM 对象转换为 BookmarkDetail"""
    return BookmarkDetail(
        id=bm.id,
        type=bm.type,
        title=bm.title,
        url=bm.url,
        notes=bm.notes,
        extra_fields=bm.extra_fields,
        linked_nodes=[
            LinkedNodeInfo(id=node.id, title=node.title, stage=node.stage)
            for node in bm.linked_nodes
        ],
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in bm.tags],
        created_at=bm.created_at,
        updated_at=bm.updated_at,
    )


@router.get("/", response_model=dict)
def list_bookmarks(
    type: Optional[str] = Query(None, description="按类型筛选: paper | video | github | book"),
    search: Optional[str] = Query(None, description="模糊搜索标题"),
    tag_id: Optional[int] = Query(None, description="按标签筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    """获取收藏列表，支持按类型、搜索和标签筛选"""
    query = db.query(Bookmark)

    # 按类型筛选
    if type:
        query = query.filter(Bookmark.type == type)

    # 模糊搜索标题
    if search:
        query = query.filter(Bookmark.title.ilike(f"%{search}%"))

    # 按标签筛选
    if tag_id is not None:
        query = query.join(Bookmark.tags).filter(Tag.id == tag_id)

    # 排序
    query = query.order_by(Bookmark.updated_at.desc())

    total = query.count()

    bookmarks = (
        query.options(joinedload(Bookmark.tags))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for bm in bookmarks:
        items.append(
            BookmarkListItem(
                id=bm.id,
                type=bm.type,
                title=bm.title,
                url=bm.url,
                extra_fields=bm.extra_fields,
                tags=[{"id": t.id, "name": t.name, "color": t.color} for t in bm.tags],
                updated_at=bm.updated_at,
            )
        )

    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{bookmark_id}", response_model=BookmarkDetail)
def get_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    """获取收藏详情"""
    bm = (
        db.query(Bookmark)
        .options(joinedload(Bookmark.linked_nodes), joinedload(Bookmark.tags))
        .filter(Bookmark.id == bookmark_id)
        .first()
    )
    if not bm:
        raise HTTPException(status_code=404, detail="收藏不存在")
    return _build_bookmark_detail(bm)


@router.post("/", response_model=BookmarkDetail, status_code=201)
def create_bookmark(data: BookmarkCreate, db: Session = Depends(get_db)):
    """创建收藏"""
    bm = Bookmark(
        type=data.type,
        title=data.title,
        url=data.url,
        notes=data.notes,
    )
    bm.extra_fields = data.extra_fields  # 通过 property setter 序列化为 JSON
    db.add(bm)
    db.flush()

    if data.linked_node_ids:
        for nid in data.linked_node_ids:
            db.execute(
                bookmark_node_links.insert().values(bookmark_id=bm.id, node_id=nid)
            )

    if data.tag_ids:
        for tid in data.tag_ids:
            db.execute(
                bookmark_tags.insert().values(bookmark_id=bm.id, tag_id=tid)
            )

    db.commit()
    db.refresh(bm)
    return _build_bookmark_detail(bm)


@router.put("/{bookmark_id}", response_model=BookmarkDetail)
def update_bookmark(bookmark_id: int, data: BookmarkUpdate, db: Session = Depends(get_db)):
    """更新收藏"""
    bm = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bm:
        raise HTTPException(status_code=404, detail="收藏不存在")

    if data.title is not None:
        bm.title = data.title
    if data.url is not None:
        bm.url = data.url
    if data.notes is not None:
        bm.notes = data.notes
    if data.extra_fields is not None:
        bm.extra_fields = data.extra_fields

    if data.linked_node_ids is not None:
        db.execute(
            bookmark_node_links.delete().where(
                bookmark_node_links.c.bookmark_id == bookmark_id
            )
        )
        if data.linked_node_ids:
            for nid in data.linked_node_ids:
                db.execute(
                    bookmark_node_links.insert().values(bookmark_id=bookmark_id, node_id=nid)
                )

    if data.tag_ids is not None:
        db.execute(
            bookmark_tags.delete().where(
                bookmark_tags.c.bookmark_id == bookmark_id
            )
        )
        if data.tag_ids:
            for tid in data.tag_ids:
                db.execute(
                    bookmark_tags.insert().values(bookmark_id=bookmark_id, tag_id=tid)
                )

    db.commit()
    db.refresh(bm)
    return _build_bookmark_detail(bm)


@router.delete("/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    """删除收藏"""
    bm = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bm:
        raise HTTPException(status_code=404, detail="收藏不存在")
    db.delete(bm)
    db.commit()
    return None
