"""设置相关 API：备份、恢复、导入、导出"""
import json
import io
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import inspect as sa_inspect

from app.database import get_db
from app.models.roadmap import RoadmapNode, LearningProgress
from app.models.note import Note, note_node_links, note_tags
from app.models.bookmark import Bookmark, bookmark_node_links, bookmark_tags
from app.models.tag import Tag
from app.services.import_service import (
    parse_markdown_roadmap,
    parse_papers_from_md,
    parse_github_from_md,
    parse_videos_from_md,
    parse_books_from_md,
)
from app.services.export_service import (
    export_roadmap_as_mindmap,
    export_notes_as_markdown,
    export_bookmarks_as_markdown,
)

router = APIRouter(prefix="/api/settings", tags=["settings"])


# ──────────────────────────────────────────────
# 工具函数
# ──────────────────────────────────────────────

def obj_to_dict(obj):
    """将 SQLAlchemy 对象转为 dict（只取列属性，忽略 relationship）"""
    mapper = sa_inspect(obj).mapper
    return {c.key: getattr(obj, c.key) for c in mapper.column_attrs}


def _json_serializer(obj):
    """自定义 JSON 序列化器：处理 datetime 等类型"""
    from datetime import datetime, date
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


# ──────────────────────────────────────────────
# GET /backup — 导出全量数据
# ──────────────────────────────────────────────

@router.get("/backup")
def backup_all(db: Session = Depends(get_db)):
    """导出全量数据为 JSON 文件"""
    data = {}

    # 表顺序：先主表，再关联表
    tables = [
        ("roadmap_nodes", RoadmapNode),
        ("learning_progress", LearningProgress),
        ("notes", Note),
        ("bookmarks", Bookmark),
        ("tags", Tag),
    ]

    for name, model in tables:
        rows = db.query(model).all()
        data[name] = [obj_to_dict(row) for row in rows]

    # 关联表（直接查表）
    for name, table in [
        ("note_node_links", note_node_links),
        ("bookmark_node_links", bookmark_node_links),
        ("note_tags", note_tags),
        ("bookmark_tags", bookmark_tags),
    ]:
        rows = db.execute(table.select()).fetchall()
        data[name] = [dict(r._mapping) for r in rows]

    json_str = json.dumps(data, ensure_ascii=False, indent=2, default=_json_serializer)

    return StreamingResponse(
        io.BytesIO(json_str.encode("utf-8")),
        media_type="application/json",
        headers={
            "Content-Disposition": "attachment; filename=llm_learning_backup.json"
        },
    )


# ──────────────────────────────────────────────
# POST /restore — 恢复数据
# ──────────────────────────────────────────────

@router.post("/restore")
async def restore_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """从 JSON 备份文件恢复数据"""
    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"JSON 解析失败: {str(e)}")

    # 清空现有数据（先删关联表，再删主表，避免外键约束问题）
    for table in [bookmark_tags, note_tags, bookmark_node_links, note_node_links]:
        db.execute(table.delete())
    for model in [Bookmark, Note, LearningProgress, RoadmapNode, Tag]:
        db.query(model).delete()
    db.flush()

    restored = {}

    # 先恢复 tags
    for row in data.get("tags", []):
        tag = Tag(id=row.get("id"), name=row["name"], color=row.get("color", "#6366f1"))
        db.add(tag)
    db.flush()

    # 恢复 roadmap_nodes
    # 注意：不传 created_at/updated_at，让数据库默认值处理（SQLite DateTime 不接受字符串）
    for row in data.get("roadmap_nodes", []):
        node = RoadmapNode(
            id=row.get("id"),
            parent_id=row.get("parent_id"),
            title=row["title"],
            description=row.get("description"),
            sort_order=row.get("sort_order", 0),
            stage=row.get("stage"),
            depth=row.get("depth", 0),
            icon=row.get("icon"),
        )
        db.add(node)
    db.flush()

    # 恢复 learning_progress
    for row in data.get("learning_progress", []):
        progress = LearningProgress(
            id=row.get("id"),
            node_id=row["node_id"],
            status=row.get("status", "not_started"),
        )
        db.add(progress)
    db.flush()

    # 恢复 notes
    for row in data.get("notes", []):
        note = Note(
            id=row.get("id"),
            title=row["title"],
            content=row.get("content", ""),
        )
        db.add(note)
    db.flush()

    # 恢复 bookmarks
    for row in data.get("bookmarks", []):
        bookmark = Bookmark(
            id=row.get("id"),
            type=row["type"],
            title=row["title"],
            url=row.get("url"),
            notes=row.get("notes"),
        )
        # 单独设置 extra_fields（_extra_fields 是列名，extra_fields 是 property）
        extra = row.get("_extra_fields")
        if extra is not None:
            if isinstance(extra, str):
                bookmark._extra_fields = extra  # 已是 JSON 字符串
            elif isinstance(extra, dict):
                bookmark.extra_fields = extra  # 通过 property setter
        db.add(bookmark)
    db.flush()

    # 恢复关联表
    for table, key in [
        (note_node_links, "note_node_links"),
        (bookmark_node_links, "bookmark_node_links"),
        (note_tags, "note_tags"),
        (bookmark_tags, "bookmark_tags"),
    ]:
        for row in data.get(key, []):
            db.execute(table.insert().values(**row))

    db.commit()

    # 统计恢复数量
    restored["nodes"] = len(data.get("roadmap_nodes", []))
    restored["notes"] = len(data.get("notes", []))
    restored["bookmarks"] = len(data.get("bookmarks", []))
    restored["tags"] = len(data.get("tags", []))

    return {
        "success": True,
        "message": f"数据已恢复：{restored['nodes']} 个节点、{restored['notes']} 篇笔记、{restored['bookmarks']} 个收藏、{restored['tags']} 个标签",
    }


# ──────────────────────────────────────────────
# POST /import-roadmap — 导入学习路线
# ──────────────────────────────────────────────

@router.post("/import-roadmap")
async def import_roadmap(
    file: UploadFile = File(...),
    confirm: bool = Query(False, description="确认导入（清空现有数据并写入）"),
    db: Session = Depends(get_db),
):
    """
    导入学习路线 Markdown 文件

    - 不传 confirm 或 confirm=false：只预览解析结果
    - confirm=true：清空现有路线数据并导入
    """
    if not file.filename or not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="仅支持 .md 文件")

    content = await file.read()
    md_text = content.decode("utf-8")

    # 解析各部分
    nodes = parse_markdown_roadmap(md_text)
    papers = parse_papers_from_md(md_text)
    github_projects = parse_github_from_md(md_text)
    videos = parse_videos_from_md(md_text)
    books = parse_books_from_md(md_text)

    if not confirm:
        # 仅预览
        return {
            "preview": True,
            "nodes": [{"title": n["title"], "depth": n["depth"], "parent_index": n["parent_index"]} for n in nodes],
            "total_nodes": len(nodes),
            "papers_count": len(papers),
            "github_count": len(github_projects),
            "videos_count": len(videos),
            "books_count": len(books),
            "sample_nodes": nodes[:5] if nodes else [],
        }

    # confirm=true：清空现有路线数据并导入
    # 清空（先删关联表）
    for table in [bookmark_node_links, note_node_links]:
        db.execute(table.delete())
    for model in [Bookmark, Note, LearningProgress]:
        db.query(model).delete()
    db.query(RoadmapNode).delete()
    db.flush()

    # 插入节点（需要按顺序：先插入根节点，再插入子节点）
    # 由于节点列表按解析顺序排列（父节点总是在子节点前），直接按序插入即可
    id_map = {}  # old_index -> new_id
    nodes_created = 0

    for i, node_data in enumerate(nodes):
        # 确定 parent_id
        parent_id = None
        if node_data["parent_index"] >= 0 and node_data["parent_index"] in id_map:
            parent_id = id_map[node_data["parent_index"]]

        # 处理 depth
        depth = node_data.get("depth", 0)

        # 处理 stage（继承父节点）
        stage = node_data.get("stage")
        if not stage and parent_id is not None:
            # 查找父节点的 stage
            parent_node = db.query(RoadmapNode).filter(RoadmapNode.id == parent_id).first()
            if parent_node:
                stage = parent_node.stage

        # 提取 emoji icon
        icon = node_data.get("icon")

        node = RoadmapNode(
            parent_id=parent_id,
            title=node_data["title"],
            description=None,
            sort_order=i,
            stage=stage,
            depth=depth,
            icon=icon,
        )
        db.add(node)
        db.flush()
        id_map[i] = node.id

        # 为每个节点创建初始进度
        db.add(LearningProgress(node_id=node.id, status="not_started"))
        nodes_created += 1

    # 导入论文为 bookmark
    papers_count = 0
    for paper in papers:
        bookmark = Bookmark(
            type="paper",
            title=paper["title"],
            url="",
            extra_fields={
                "author": paper.get("author", ""),
                "year": paper["year"],
                "conference": paper.get("conference", ""),
                "read_status": "unread",
            },
        )
        db.add(bookmark)
        papers_count += 1

    # 导入 GitHub 项目
    github_count = 0
    for proj in github_projects:
        bookmark = Bookmark(
            type="github",
            title=proj["title"],
            url=proj.get("url", ""),
            extra_fields={
                "stars": proj.get("stars", ""),
                "description": proj.get("description", ""),
            },
        )
        db.add(bookmark)
        github_count += 1

    # 导入视频
    videos_count = 0
    for vid in videos:
        bookmark = Bookmark(
            type="video",
            title=vid["title"],
            url=vid.get("url", ""),
            extra_fields={
                "platform": vid.get("platform", ""),
                "author": vid.get("author", ""),
            },
        )
        db.add(bookmark)
        videos_count += 1

    # 导入书籍
    books_count = 0
    for book in books:
        bookmark = Bookmark(
            type="book",
            title=book["title"],
            url="",
            extra_fields={
                "author": book.get("author", ""),
            },
        )
        db.add(bookmark)
        books_count += 1

    db.commit()

    return {
        "success": True,
        "nodes_count": nodes_created,
        "papers_count": papers_count,
        "github_count": github_count,
        "videos_count": videos_count,
        "books_count": books_count,
        "message": f"成功导入 {nodes_created} 个路线节点、{papers_count} 篇论文、{github_count} 个 GitHub 项目、{videos_count} 个视频、{books_count} 本书籍",
    }


# ──────────────────────────────────────────────
# GET /export-roadmap — 导出路线思维导图
# ──────────────────────────────────────────────

@router.get("/export-roadmap")
def export_roadmap(db: Session = Depends(get_db)):
    """导出路线为思维导图格式 Markdown"""
    nodes = db.query(RoadmapNode).order_by(RoadmapNode.sort_order).all()

    if not nodes:
        return StreamingResponse(
            io.BytesIO("# 🗺️ 学习路线\n(空)".encode("utf-8")),
            media_type="text/markdown",
            headers={"Content-Disposition": "attachment; filename=roadmap_mindmap.md"},
        )

    # 构建树形 dict
    node_map = {}
    for n in nodes:
        node_map[n.id] = {
            "id": n.id,
            "title": n.title,
            "depth": n.depth,
            "sort_order": n.sort_order,
            "children": [],
        }

    roots = []
    for n in nodes:
        if n.parent_id is not None and n.parent_id in node_map:
            node_map[n.parent_id]["children"].append(node_map[n.id])
        else:
            roots.append(node_map[n.id])

    # 构建返回列表（根节点 + 递归展开）
    def flatten(node):
        result = [node]
        for child in sorted(node["children"], key=lambda x: x.get("sort_order", 0)):
            result.extend(flatten(child))
        return result

    # 如果单个根节点
    all_nodes = []
    for root in sorted(roots, key=lambda x: x.get("sort_order", 0)):
        all_nodes.extend(flatten(root))

    md_content = export_roadmap_as_mindmap(all_nodes)

    return StreamingResponse(
        io.BytesIO(md_content.encode("utf-8")),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=roadmap_mindmap.md"},
    )


# ──────────────────────────────────────────────
# GET /export-notes — 导出笔记
# ──────────────────────────────────────────────

@router.get("/export-notes")
def export_notes(
    ids: Optional[str] = Query(None, description="逗号分隔的笔记 ID，不传则导出全部"),
    db: Session = Depends(get_db),
):
    """导出笔记为 Markdown 文件"""
    query = db.query(Note)

    if ids:
        id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
        query = query.filter(Note.id.in_(id_list))

    notes = query.order_by(Note.updated_at.desc()).all()

    # 构建导出数据
    notes_data = []
    for note in notes:
        notes_data.append({
            "title": note.title,
            "content": note.content or "",
            "created_at": note.created_at.isoformat() if note.created_at else "",
            "updated_at": note.updated_at.isoformat() if note.updated_at else "",
            "linked_nodes": [
                {"id": n.id, "title": n.title} for n in note.linked_nodes
            ],
        })

    md_content = export_notes_as_markdown(notes_data)

    return StreamingResponse(
        io.BytesIO(md_content.encode("utf-8")),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=learning_notes.md"},
    )


# ──────────────────────────────────────────────
# GET /export-bookmarks — 导出收藏
# ──────────────────────────────────────────────

@router.get("/export-bookmarks")
def export_bookmarks(
    type: str = Query(..., description="收藏类型: paper / video / github / book"),
    db: Session = Depends(get_db),
):
    """导出收藏为 Markdown 表格文件"""
    valid_types = ["paper", "video", "github", "book"]
    if type not in valid_types:
        raise HTTPException(status_code=400, detail=f"type 必须为以下之一: {', '.join(valid_types)}")

    bookmarks = db.query(Bookmark).filter(Bookmark.type == type).order_by(Bookmark.created_at.desc()).all()

    bookmarks_data = []
    for bm in bookmarks:
        bookmarks_data.append({
            "title": bm.title,
            "url": bm.url or "",
            "extra_fields": bm.extra_fields,
        })

    md_content = export_bookmarks_as_markdown(bookmarks_data, type)

    filename_map = {
        "paper": "papers_bookmarks.md",
        "video": "videos_bookmarks.md",
        "github": "github_bookmarks.md",
        "book": "books_bookmarks.md",
    }

    return StreamingResponse(
        io.BytesIO(md_content.encode("utf-8")),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename_map.get(type, 'bookmarks.md')}"},
    )
