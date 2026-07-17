from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProgressSchema(BaseModel):
    id: int
    node_id: int
    status: str  # not_started | in_progress | completed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoadmapNodeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    sort_order: int = 0
    stage: Optional[str] = None
    icon: Optional[str] = None


class RoadmapNodeCreate(RoadmapNodeBase):
    parent_id: Optional[int] = None


class RoadmapNodeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    stage: Optional[str] = None
    icon: Optional[str] = None


class RoadmapNodeInTree(BaseModel):
    id: int
    parent_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    sort_order: int
    stage: Optional[str] = None
    depth: int
    icon: Optional[str] = None
    status: str = "not_started"
    children: List["RoadmapNodeInTree"] = []

    class Config:
        from_attributes = True


class RoadmapNodeDetail(RoadmapNodeInTree):
    progress: Optional[ProgressSchema] = None
    linked_notes: List[dict] = []
    linked_bookmarks: List[dict] = []


class ProgressUpdate(BaseModel):
    status: str  # not_started | in_progress | completed


class SortUpdate(BaseModel):
    sort_order: int
