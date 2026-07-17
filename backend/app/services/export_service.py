"""Markdown/思维导图导出服务"""
from typing import List, Dict, Optional
from datetime import datetime


def export_roadmap_as_mindmap(nodes: List[Dict]) -> str:
    """
    将路线节点列表导出为思维导图文本格式

    nodes: [{"id": 1, "title": "...", "depth": 0, "children": [...]}, ...]
    根节点为 nodes[0]

    输出格式：
    # 🗺️ LLM 学习路线
    ├── 一、认知脱盲期
    │   ├── 1. Transformer 架构
    │   │   ├── Self-Attention 机制
    │   │   └── ...
    │   └── ...
    └── ...
    """
    if not nodes:
        return "# 🗺️ 学习路线\n(空)"

    lines = ["# 🗺️ LLM 学习路线", ""]

    def render_children(children: List[Dict], prefix: str = "", is_last_child: bool = True):
        for i, node in enumerate(children):
            is_last = (i == len(children) - 1)

            if prefix == "":  # 第一层
                connector = "└── " if is_last else "├── "
                line = f"{connector}{node['title']}"
            else:
                connector = "└── " if is_last else "├── "
                line = f"{prefix}{connector}{node['title']}"

            lines.append(line)

            if node.get("children"):
                if prefix == "":
                    new_prefix = "    " if is_last else "│   "
                else:
                    new_prefix = prefix + ("    " if is_last else "│   ")
                render_children(node["children"], new_prefix, is_last)

    root = nodes[0]
    lines.append(root["title"])
    if root.get("children"):
        render_children(root["children"])

    return "\n".join(lines)


def export_notes_as_markdown(notes: List[Dict], include_links: bool = True) -> str:
    """
    将笔记列表导出为 Markdown 格式

    每篇笔记格式：
    # 笔记标题
    > 创建于 YYYY-MM-DD | 更新于 YYYY-MM-DD | 关联节点: Node1, Node2

    笔记正文内容...

    ---
    """
    lines = ["# 📝 学习笔记导出", f"> 导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ""]

    for note in notes:
        lines.append(f"## {note['title']}")

        # 元信息
        created = note.get('created_at', '')
        updated = note.get('updated_at', '')
        linked = note.get('linked_nodes', [])
        linked_str = ", ".join(n.get('title', '') for n in linked) if linked else "无"

        meta_parts = []
        if created:
            meta_parts.append(f"创建于 {created[:10]}")
        if updated:
            meta_parts.append(f"更新于 {updated[:10]}")
        meta_parts.append(f"关联节点: {linked_str}")

        lines.append(f"> {' | '.join(meta_parts)}")
        lines.append("")
        lines.append(note.get('content', ''))
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def export_bookmarks_as_markdown(bookmarks: List[Dict], bookmark_type: str) -> str:
    """
    将收藏列表导出为 Markdown 表格

    bookmark_type: "paper" | "video" | "github" | "book"
    """
    type_names = {"paper": "论文", "video": "视频", "github": "GitHub 项目", "book": "书籍"}
    type_name = type_names.get(bookmark_type, bookmark_type)

    lines = [
        f"# ⭐ {type_name}收藏导出",
        f"> 导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"> 数量: {len(bookmarks)}",
        "",
    ]

    if bookmark_type == "paper":
        lines.append("| 标题 | 作者 | 年份 | 会议/期刊 | 阅读状态 | 链接 |")
        lines.append("|------|------|------|-----------|----------|------|")
        for bm in bookmarks:
            extra = bm.get('extra_fields', {})
            author = extra.get('author', '-')
            year = extra.get('year', '-')
            conf = extra.get('conference', '-')
            status = extra.get('read_status', 'unread')
            url = bm.get('url', '')
            url_str = f"[链接]({url})" if url else "-"
            title = bm.get('title', '-')
            lines.append(f"| {title} | {author} | {year} | {conf} | {status} | {url_str} |")

    elif bookmark_type == "github":
        lines.append("| 项目名 | Star | 语言 | 链接 |")
        lines.append("|--------|------|------|------|")
        for bm in bookmarks:
            extra = bm.get('extra_fields', {})
            stars = extra.get('stars', '-')
            lang = extra.get('language', '-')
            url = bm.get('url', '')
            url_str = f"[GitHub]({url})" if url else "-"
            title = bm.get('title', '-')
            lines.append(f"| {title} | {stars} | {lang} | {url_str} |")

    elif bookmark_type == "video":
        lines.append("| 标题 | 平台 | 作者 | 链接 |")
        lines.append("|------|------|------|------|")
        for bm in bookmarks:
            extra = bm.get('extra_fields', {})
            platform = extra.get('platform', '-')
            author = extra.get('author', '-')
            url = bm.get('url', '')
            url_str = f"[观看]({url})" if url else "-"
            title = bm.get('title', '-')
            lines.append(f"| {title} | {platform} | {author} | {url_str} |")

    elif bookmark_type == "book":
        lines.append("| 书名 | 作者 | 链接 |")
        lines.append("|------|------|------|")
        for bm in bookmarks:
            extra = bm.get('extra_fields', {})
            author = extra.get('author', '-')
            url = bm.get('url', '')
            url_str = f"[链接]({url})" if url else "-"
            title = bm.get('title', '-')
            lines.append(f"| {title} | {author} | {url_str} |")

    return "\n".join(lines)
