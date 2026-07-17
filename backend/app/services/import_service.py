"""Markdown 学习路线导入解析服务"""
import re
from typing import List, Dict, Optional


def parse_markdown_roadmap(md_content: str) -> List[Dict]:
    """
    解析 markdown 文件中的学习路线树形结构

    解析规则：
    - ## 开头 → 阶段（一级节点，depth=1）
    - ### 开头 → 主题（二级节点，depth=2）
    - #### 开头 → 叶子节点（三级节点，depth=3）
    - 或从代码块中的树形图解析（├── └── │ 格式）

    返回格式化的节点列表，包含 parent 索引关系
    """
    nodes = []

    # 策略1：尝试从树形代码块解析（第9-129行的思维导图）
    tree_block = re.search(r'```\n(🚀.*?)\n```', md_content, re.DOTALL)
    if tree_block:
        nodes = _parse_tree_block(tree_block.group(1))

    # 策略2：如果树形解析失败，从 markdown 标题解析
    if not nodes:
        nodes = _parse_heading_structure(md_content)

    return nodes


def _parse_tree_block(text: str) -> List[Dict]:
    """从 ├── └── │ 树形文本解析节点"""
    nodes = []
    lines = text.strip().split('\n')

    # 辅助：提取 emoji 图标
    def extract_icon(title: str):
        emoji_match = re.match(r'[\U0001F300-\U0001FAFF☀-➿⌀-⏿☀-➿]', title)
        return emoji_match.group() if emoji_match else None

    # 根节点（第一行，通常以 🚀 或类似开头，没有 ├── 前缀）
    root_title = lines[0].strip()
    if root_title:
        nodes.append({
            "title": root_title,
            "parent_index": -1,
            "depth": 0,
            "stage": None,
            "icon": extract_icon(root_title),
        })

    # 记录每个深度最近添加的节点索引
    last_node_at_depth = {0: 0}

    for line in lines[1:]:
        # 查找树形连接符 ── 或 └──
        connector_match = re.search(r'[├└]──', line)
        if not connector_match:
            continue

        pos = connector_match.start()
        depth = (pos // 4) + 1  # 每 4 个字符一个缩进层级

        # 提取标题（去除树形字符）
        title = line[pos + 4:].strip()
        if not title:
            continue

        # 提取图标
        icon = extract_icon(title)

        # 确定父节点
        parent_index = last_node_at_depth.get(depth - 1, 0)

        # 确定 stage（继承自 depth=1 的祖先）
        stage = None
        if depth == 1:
            stage = title
        elif depth > 1:
            ancestor_idx = parent_index
            while ancestor_idx >= 0:
                ancestor = nodes[ancestor_idx]
                if ancestor["depth"] == 1:
                    stage = ancestor["title"]
                    break
                ancestor_idx = ancestor.get("parent_index", -1)

        nodes.append({
            "title": title,
            "parent_index": parent_index,
            "depth": depth,
            "stage": stage,
            "icon": icon,
        })

        last_node_at_depth[depth] = len(nodes) - 1
        # 清除更深层的记录（当前节点开启了新的子层级）
        for d in list(last_node_at_depth.keys()):
            if d > depth:
                del last_node_at_depth[d]

    return nodes


def _parse_heading_structure(md_content: str) -> List[Dict]:
    """从 markdown 标题结构解析（备选方案）"""
    nodes = []
    headings = re.findall(r'^(#{1,4})\s+(.+)$', md_content, re.MULTILINE)

    prev_depths = {-1: -1}  # depth -> last_index
    for level_str, title in headings:
        level = len(level_str) - 1  # ## → depth 1, ### → depth 2
        title = title.strip()

        if level > 3:  # 最多3层
            continue

        parent_index = -1
        for d in range(level - 1, -1, -1):
            if d in prev_depths:
                parent_index = prev_depths[d]
                break

        stage = None
        if level == 1:
            stage_match = re.match(r'[一二三四五六七八九十]+、(.+)', title)
            if stage_match:
                stage = stage_match.group(1)

        nodes.append({
            "title": title,
            "parent_index": parent_index,
            "depth": level,
            "stage": stage,
            "icon": None,
        })

        prev_depths[level] = len(nodes) - 1

    return nodes


def parse_papers_from_md(md_content: str) -> List[Dict]:
    """从 markdown 表格中解析论文"""
    papers = []
    # 匹配表格行：| 序号 | 论文 | 年份 | 核心贡献 |
    table_pattern = re.compile(r'\|\s*(\d+)\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(\d{4})\s*\|\s*(.+?)\s*\|')
    matches = table_pattern.findall(md_content)

    for num, title, year, contribution in matches:
        papers.append({
            "title": title.strip(),
            "year": int(year),
            "conference": contribution.strip(),
            "author": "",  # md 表格中没有作者列
        })

    return papers


def parse_github_from_md(md_content: str) -> List[Dict]:
    """从 markdown 表格中解析 GitHub 项目"""
    projects = []
    # 匹配：| **项目名** | Star数 | 说明 | [GitHub](url) |
    pattern = re.compile(r'\|\s*\*\*(.+?)\*\*\s*\|(.+?)\|(.+?)\|\s*\[GitHub\]\((.+?)\)\s*\|')
    matches = pattern.findall(md_content)

    for name, stars, desc, url in matches:
        projects.append({
            "title": name.strip(),
            "url": url.strip(),
            "stars": stars.strip(),
            "description": desc.strip(),
        })

    return projects


def parse_videos_from_md(md_content: str) -> List[Dict]:
    """从 markdown 中解析视频资源"""
    videos = []
    # 匹配包含 YouTube/B站 链接的行
    # 格式：| 资源名 | 说明 | [YouTube](url) / B站搜...
    pattern = re.compile(r'\|\s*\*\*(.+?)\*\*\s*\|(.+?)\|\s*\[YouTube\]\((.+?)\)')
    matches = pattern.findall(md_content)

    for title, desc, url in matches:
        videos.append({
            "title": title.strip(),
            "url": url.strip(),
            "platform": "YouTube",
            "author": "",
        })

    # 也匹配 GitHub 链接格式的视频资源
    pattern2 = re.compile(r'\|\s*\*\*(.+?)\*\*\s*\|(.+?)\|\s*\[GitHub:\s*(.+?)\]\((.+?)\)')
    matches2 = pattern2.findall(md_content)
    for title, desc, repo_name, url in matches2:
        videos.append({
            "title": title.strip(),
            "url": url.strip(),
            "platform": "GitHub",
            "author": "",
        })

    return videos


def parse_books_from_md(md_content: str) -> List[Dict]:
    """从 markdown 中解析书籍"""
    books = []
    # 匹配：| **书名** | 说明 |
    pattern = re.compile(r'\|\s*\*\*(.+?)\*\*\s*\|(.+?)\|')
    # 只在"推荐书籍"章节匹配
    book_section = re.search(r'推荐书籍(.+?)(?=\n---|\Z)', md_content, re.DOTALL)
    if book_section:
        matches = pattern.findall(book_section.group(0))
        for name, desc in matches:
            name = name.strip()
            if '书名' in name:  # 跳过表头
                continue
            books.append({
                "title": name,
                "author": "",
                "description": desc.strip(),
            })

    return books
