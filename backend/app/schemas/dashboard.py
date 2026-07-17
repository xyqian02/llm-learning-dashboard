from pydantic import BaseModel
from typing import List, Optional


class DashboardOverview(BaseModel):
    total_progress: float  # 0-100 百分比
    in_progress_count: int
    recent_days: int  # 最近有学习活动的天数


class StageProgress(BaseModel):
    stage: str
    total: int
    completed: int
    percentage: float


class RecentActivity(BaseModel):
    type: str  # "progress" | "note" | "bookmark"
    title: str
    node_title: Optional[str] = None
    timestamp: str
