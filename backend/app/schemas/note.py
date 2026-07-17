from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = ""


class NoteCreate(NoteBase):
    linked_node_ids: List[int] = []
    tag_ids: List[int] = []


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    linked_node_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None


class TagSchema(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True


class NoteListItem(BaseModel):
    id: int
    title: str
    content_preview: str = ""  # 前 150 字符
    tags: List[TagSchema] = []
    updated_at: datetime

    class Config:
        from_attributes = True


class LinkedNodeInfo(BaseModel):
    id: int
    title: str
    stage: Optional[str] = None

    class Config:
        from_attributes = True


class NoteDetail(BaseModel):
    id: int
    title: str
    content: str
    linked_nodes: List[LinkedNodeInfo] = []
    tags: List[TagSchema] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
