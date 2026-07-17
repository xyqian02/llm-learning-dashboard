from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.schemas.note import LinkedNodeInfo


class BookmarkBase(BaseModel):
    type: str  # paper | video | github | book
    title: str = Field(..., min_length=1, max_length=500)
    url: Optional[str] = None
    notes: Optional[str] = None
    extra_fields: Dict[str, Any] = {}


class BookmarkCreate(BookmarkBase):
    linked_node_ids: List[int] = []
    tag_ids: List[int] = []


class BookmarkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    extra_fields: Optional[Dict[str, Any]] = None
    linked_node_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None


class BookmarkListItem(BaseModel):
    id: int
    type: str
    title: str
    url: Optional[str] = None
    extra_fields: Dict[str, Any] = {}
    tags: List[dict] = []
    updated_at: datetime

    class Config:
        from_attributes = True


class BookmarkDetail(BaseModel):
    id: int
    type: str
    title: str
    url: Optional[str] = None
    notes: Optional[str] = None
    extra_fields: Dict[str, Any] = {}
    linked_nodes: List[LinkedNodeInfo] = []
    tags: List[dict] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
