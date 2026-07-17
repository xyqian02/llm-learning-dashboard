from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import List

from app.database import get_db
from app.models.roadmap import RoadmapNode, LearningProgress
from app.schemas.dashboard import DashboardOverview, StageProgress, RecentActivity

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def get_overview(db: Session = Depends(get_db)):
    """获取仪表盘概览数据"""
    total_nodes = db.query(func.count(RoadmapNode.id)).scalar() or 0
    completed_count = db.query(func.count(LearningProgress.id)).filter(
        LearningProgress.status == "completed"
    ).scalar() or 0
    in_progress_count = db.query(func.count(LearningProgress.id)).filter(
        LearningProgress.status == "in_progress"
    ).scalar() or 0

    total_progress = (completed_count / total_nodes * 100) if total_nodes > 0 else 0.0

    # 最近30天内有学习活动的天数
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_days = db.query(func.count(func.distinct(func.date(LearningProgress.updated_at)))).filter(
        LearningProgress.updated_at >= thirty_days_ago
    ).scalar() or 0

    return DashboardOverview(
        total_progress=round(total_progress, 1),
        in_progress_count=in_progress_count,
        recent_days=recent_days,
    )


@router.get("/stage-progress", response_model=List[StageProgress])
def get_stage_progress(db: Session = Depends(get_db)):
    """按 stage 分组统计进度"""
    # 按 stage 分组统计每个阶段的总节点数
    stage_totals = (
        db.query(RoadmapNode.stage, func.count(RoadmapNode.id))
        .filter(RoadmapNode.stage.isnot(None))
        .group_by(RoadmapNode.stage)
        .all()
    )

    # 按 stage 分组统计每个阶段的已完成节点数
    stage_completed = (
        db.query(RoadmapNode.stage, func.count(LearningProgress.id))
        .join(LearningProgress, RoadmapNode.id == LearningProgress.node_id)
        .filter(LearningProgress.status == "completed", RoadmapNode.stage.isnot(None))
        .group_by(RoadmapNode.stage)
        .all()
    )

    completed_map = {stage: count for stage, count in stage_completed}

    result = []
    for stage, total in stage_totals:
        completed = completed_map.get(stage, 0)
        percentage = round(completed / total * 100, 1) if total > 0 else 0.0
        result.append(StageProgress(
            stage=stage,
            total=total,
            completed=completed,
            percentage=percentage,
        ))

    # 按 percentage 降序排列
    result.sort(key=lambda x: x.percentage, reverse=True)
    return result


@router.get("/recent-activity", response_model=List[RecentActivity])
def get_recent_activity(db: Session = Depends(get_db)):
    """获取最近 20 条学习活动"""
    recent_progress = (
        db.query(LearningProgress)
        .filter(LearningProgress.updated_at.isnot(None))
        .order_by(LearningProgress.updated_at.desc())
        .limit(20)
        .all()
    )

    activities = []
    for p in recent_progress:
        node = db.query(RoadmapNode).filter(RoadmapNode.id == p.node_id).first()
        node_title = node.title if node else None

        # 根据状态变化生成描述
        title = f"节点学习状态更新为 {p.status}"

        activities.append(RecentActivity(
            type="progress",
            title=title,
            node_title=node_title,
            timestamp=p.updated_at.isoformat() if p.updated_at else "",
        ))

    return activities
