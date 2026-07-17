from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import json


# 收藏↔节点 多对多关联表
bookmark_node_links = Table(
    "bookmark_node_links",
    Base.metadata,
    Column("bookmark_id", Integer, ForeignKey("bookmarks.id", ondelete="CASCADE"), primary_key=True),
    Column("node_id", Integer, ForeignKey("roadmap_nodes.id", ondelete="CASCADE"), primary_key=True),
)

# 收藏↔标签 多对多关联表
bookmark_tags = Table(
    "bookmark_tags",
    Base.metadata,
    Column("bookmark_id", Integer, ForeignKey("bookmarks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(20), nullable=False)  # paper / video / github / book
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=True)
    notes = Column(Text, nullable=True)
    _extra_fields = Column("extra_fields", Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    linked_nodes = relationship("RoadmapNode", secondary=bookmark_node_links, backref="bookmarks")
    tags = relationship("Tag", secondary=bookmark_tags, backref="bookmarks")

    @property
    def extra_fields(self) -> dict:
        if self._extra_fields:
            return json.loads(self._extra_fields)
        return {}

    @extra_fields.setter
    def extra_fields(self, value: dict):
        self._extra_fields = json.dumps(value, ensure_ascii=False) if value else None
