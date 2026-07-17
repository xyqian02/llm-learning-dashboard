from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


# 笔记↔节点 多对多关联表
note_node_links = Table(
    "note_node_links",
    Base.metadata,
    Column("note_id", Integer, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("node_id", Integer, ForeignKey("roadmap_nodes.id", ondelete="CASCADE"), primary_key=True),
)

# 笔记↔标签 多对多关联表
note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", Integer, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    linked_nodes = relationship("RoadmapNode", secondary=note_node_links, backref="notes")
    tags = relationship("Tag", secondary=note_tags, backref="notes")
