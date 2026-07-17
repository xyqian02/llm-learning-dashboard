from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.tag import Tag
from app.models.note import note_tags
from app.models.bookmark import bookmark_tags
from app.schemas.tag import TagCreate

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("/", response_model=list)
def list_tags(db: Session = Depends(get_db)):
    """获取所有标签，附带使用计数"""
    tags = db.query(Tag).order_by(Tag.name.asc()).all()

    result = []
    for tag in tags:
        # 统计在笔记中的使用次数
        note_count = db.query(func.count()).select_from(note_tags).filter(
            note_tags.c.tag_id == tag.id
        ).scalar()

        # 统计在收藏中的使用次数
        bookmark_count = db.query(func.count()).select_from(bookmark_tags).filter(
            bookmark_tags.c.tag_id == tag.id
        ).scalar()

        result.append({
            "id": tag.id,
            "name": tag.name,
            "color": tag.color,
            "used_count": (note_count or 0) + (bookmark_count or 0),
        })

    return result


@router.post("/", status_code=201)
def create_tag(data: TagCreate, db: Session = Depends(get_db)):
    """创建标签"""
    # 检查标签名是否重复
    existing = db.query(Tag).filter(Tag.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"标签 '{data.name}' 已存在")

    tag = Tag(name=data.name, color=data.color)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return {"id": tag.id, "name": tag.name, "color": tag.color}


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    """删除标签（级联删除关联表中的记录）"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    db.delete(tag)
    db.commit()
    return None
