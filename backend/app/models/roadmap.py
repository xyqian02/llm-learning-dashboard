from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class RoadmapNode(Base):
    __tablename__ = "roadmap_nodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_id = Column(Integer, ForeignKey("roadmap_nodes.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    stage = Column(String(100), nullable=True)
    depth = Column(Integer, default=0)
    icon = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 自引用关系（树形结构，每个节点最多一个父节点）
    children = relationship("RoadmapNode", backref="parent", remote_side=[id],
                            cascade="all, delete-orphan", single_parent=True)

    # 关联（NoteNodeLink 和 BookmarkNodeLink 不作为独立模型，
    # 反向关系通过 Note.linked_nodes 和 Bookmark.linked_nodes 的 backref 提供）
    progress = relationship("LearningProgress", back_populates="node", uselist=False,
                            cascade="all, delete-orphan")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    node_id = Column(Integer, ForeignKey("roadmap_nodes.id"), unique=True, nullable=False)
    status = Column(String(20), default="not_started")  # not_started / in_progress / completed
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    node = relationship("RoadmapNode", back_populates="progress")
