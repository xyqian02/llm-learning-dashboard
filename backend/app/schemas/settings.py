from pydantic import BaseModel
from typing import Optional, List


class BackupData(BaseModel):
    """全量备份数据结构"""
    roadmap_nodes: list
    learning_progress: list
    notes: list
    note_node_links: list
    bookmarks: list
    bookmark_node_links: list
    tags: list
    note_tags: list
    bookmark_tags: list


class ImportResult(BaseModel):
    success: bool
    nodes_count: int
    papers_count: int
    github_count: int
    videos_count: int
    books_count: int
    message: str


class ExportNotesRequest(BaseModel):
    ids: Optional[List[int]] = None  # None = 全部


class ImportPreview(BaseModel):
    """导入预览：展示解析后的节点树结构"""
    nodes: list
    total_nodes: int
    papers_count: int
    github_count: int
    videos_count: int
    books_count: int
