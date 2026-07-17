"""种子数据填充脚本：从 LLM学习路线全面指南.md 解析并导入数据库"""
import sys
import os

# 确保控制台支持 UTF-8（Windows 兼容）
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models.roadmap import RoadmapNode, LearningProgress
from app.models.note import Note
from app.models.bookmark import Bookmark
from app.models.tag import Tag
import re
import json


# ============================================================
# 工具函数
# ============================================================

def extract_icon(title: str) -> str | None:
    """从标题中提取第一个 emoji 字符作为图标"""
    # emoji 常见 Unicode 范围
    emoji_ranges = [
        (0x2600, 0x27BF),    # Misc Symbols (☀-➿)
        (0x1F300, 0x1F5FF),  # Misc Symbols and Pictographs
        (0x1F600, 0x1F64F),  # Emoticons
        (0x1F680, 0x1F6FF),  # Transport and Map
        (0x1F900, 0x1F9FF),  # Supplemental Symbols
        (0x1FA00, 0x1FAFF),  # Symbols Extended-A
        (0x2300, 0x23FF),    # Misc Technical
        (0x2B50, 0x2B55),    # Stars
        (0x2702, 0x27B0),    # Dingbats
        (0x200D, 0x200D),    # Zero-width joiner (for combined emoji)
        (0xFE0F, 0xFE0F),    # Variation selector-16
    ]

    chars = []
    i = 0
    while i < len(title):
        cp = ord(title[i])
        is_emoji = False
        for lo, hi in emoji_ranges:
            if lo <= cp <= hi:
                is_emoji = True
                break
        if is_emoji:
            # 收集连续的 emoji 字符（包括 ZWJ 序列）
            start = i
            while i < len(title):
                cp = ord(title[i])
                in_range = any(lo <= cp <= hi for lo, hi in emoji_ranges)
                if not in_range:
                    # 检查是否是 # * 0-9 等组合标记
                    if title[i] in '#*' or title[i].isdigit():
                        i += 1
                        continue
                    break
                i += 1
            chars.append(title[start:i])
        else:
            i += 1

    if chars:
        return chars[0]
    return None


def strip_markdown_format(text: str) -> str:
    """去除 Markdown 格式标记（**bold**、`code` 等）"""
    text = text.strip()
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # **bold**
    text = re.sub(r'\*(.+?)\*', r'\1', text)       # *italic*
    text = re.sub(r'`(.+?)`', r'\1', text)          # `code`
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text) # [text](url)
    return text.strip()


def extract_url_from_markdown(text: str) -> str | None:
    """从 Markdown 链接中提取 URL"""
    match = re.search(r'\[.*?\]\((https?://[^\)]+)\)', text)
    if match:
        return match.group(1)
    # 尝试直接匹配 URL
    match = re.search(r'(https?://[^\s\)]+)', text)
    if match:
        return match.group(1)
    return None


def extract_platform(text: str) -> str:
    """从链接文本推断平台"""
    text_lower = text.lower()
    if 'youtube' in text_lower:
        return 'YouTube'
    if 'b站' in text_lower or 'bilibili' in text_lower:
        return 'Bilibili'
    if 'github' in text_lower:
        return 'GitHub'
    return 'Other'


def parse_markdown_table_rows(content: str, section_start: str,
                              max_rows: int = 500) -> list[list[str]]:
    """在指定 section 后解析 markdown 表格，返回行列表（每行是 cell 列表）"""
    pos = content.find(section_start)
    if pos == -1:
        return []

    # 从 section 开始往后找表格
    remaining = content[pos:]
    lines = remaining.split('\n')

    results = []
    in_table = False
    header_seen = False

    for line in lines:
        stripped = line.strip()

        # 表格行以 | 开头
        if stripped.startswith('|') and '---' not in stripped:
            if not in_table:
                in_table = True
                header_seen = True
                continue  # 跳过表头行
            if in_table:
                cells = [c.strip() for c in stripped.split('|')[1:-1]]
                results.append(cells)
                if len(results) >= max_rows:
                    break
        elif stripped.startswith('|') and '---' in stripped:
            # 分隔行，表示表格开始
            in_table = True
            continue
        else:
            # 非表格行
            if in_table and stripped == '':
                # 空行结束表格
                break
            elif in_table and not stripped.startswith('|'):
                # 下一行不是表格内容（可能是新标题等）
                break

    return results


# ============================================================
# 论文元数据映射
# ============================================================

PAPER_META = {
    "Attention Is All You Need": {
        "author": "Vaswani et al.", "conference": "NeurIPS 2017"
    },
    "BERT": {
        "author": "Devlin et al.", "conference": "NAACL 2019"
    },
    "GPT-1": {
        "author": "Radford et al.", "conference": "OpenAI 2018"
    },
    "GPT-2": {
        "author": "Radford et al.", "conference": "OpenAI 2019"
    },
    "GPT-3": {
        "author": "Brown et al.", "conference": "NeurIPS 2020"
    },
    "Scaling Laws": {
        "author": "Kaplan et al.", "conference": "arXiv 2020"
    },
    "InstructGPT": {
        "author": "Ouyang et al.", "conference": "NeurIPS 2022"
    },
    "LoRA": {
        "author": "Hu et al.", "conference": "ICLR 2022"
    },
    "Chinchilla": {
        "author": "Hoffmann et al.", "conference": "NeurIPS 2022"
    },
    "Chain-of-Thought": {
        "author": "Wei et al.", "conference": "NeurIPS 2022"
    },
    "FlashAttention": {
        "author": "Dao et al.", "conference": "NeurIPS 2022"
    },
    "Llama 1": {
        "author": "Touvron et al.", "conference": "arXiv 2023"
    },
    "Llama 2": {
        "author": "Touvron et al.", "conference": "arXiv 2023"
    },
    "Llama 3": {
        "author": "Meta AI", "conference": "arXiv 2024"
    },
    "QLoRA": {
        "author": "Dettmers et al.", "conference": "NeurIPS 2023"
    },
    "DPO": {
        "author": "Rafailov et al.", "conference": "NeurIPS 2023"
    },
    "PagedAttention / vLLM": {
        "author": "Kwon et al.", "conference": "SOSP 2023"
    },
    "RAG": {
        "author": "Lewis et al.", "conference": "NeurIPS 2020"
    },
    "Tree of Thoughts": {
        "author": "Yao et al.", "conference": "NeurIPS 2023"
    },
    "Emergent Abilities": {
        "author": "Wei et al.", "conference": "TMLR 2022"
    },
    "MoE (Sparsely-Gated)": {
        "author": "Shazeer et al.", "conference": "ICLR 2017"
    },
}

# 论文 URL 映射
PAPER_URLS = {
    "Attention Is All You Need": "https://arxiv.org/abs/1706.03762",
    "BERT": "https://arxiv.org/abs/1810.04805",
    "GPT-1": "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
    "GPT-2": "https://d4mucfpksywv.cloudfront.net/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
    "GPT-3": "https://arxiv.org/abs/2005.14165",
    "Scaling Laws": "https://arxiv.org/abs/2001.08361",
    "InstructGPT": "https://arxiv.org/abs/2203.02155",
    "LoRA": "https://arxiv.org/abs/2106.09685",
    "Chinchilla": "https://arxiv.org/abs/2203.15556",
    "Chain-of-Thought": "https://arxiv.org/abs/2201.11903",
    "FlashAttention": "https://arxiv.org/abs/2205.14135",
    "Llama 1": "https://arxiv.org/abs/2302.13971",
    "Llama 2": "https://arxiv.org/abs/2307.09288",
    "QLoRA": "https://arxiv.org/abs/2305.14314",
    "DPO": "https://arxiv.org/abs/2305.18290",
    "PagedAttention / vLLM": "https://arxiv.org/abs/2309.06180",
    "Llama 3": "https://arxiv.org/abs/2407.21783",
    "RAG": "https://arxiv.org/abs/2005.11401",
    "Tree of Thoughts": "https://arxiv.org/abs/2305.10601",
    "Emergent Abilities": "https://arxiv.org/abs/2206.07682",
    "MoE (Sparsely-Gated)": "https://arxiv.org/abs/1701.06538",
}

# 书籍 URL 映射
BOOK_URLS = {
    "《GPT 图解》": "",
    "《大语言模型：基础与前沿》": "",
    "《动手构建大模型》": "",
    "Build a Large Language Model (From Scratch)": "https://github.com/rasbt/LLMs-from-scratch",
    "《大模型RAG实战》": "https://github.com/Nipi64310/RAG-Book",
}

# 视频 URL 补充映射（源 markdown 中未包含链接的补充）
VIDEO_URLS = {
    "李沐 \"Transformer 论文精读\"": "https://www.bilibili.com/video/BV1pu411o7BE/",
    "李宏毅 \"注意力机制\"": "https://www.bilibili.com/video/BV1Wv411h7kN/",
    "3Blue1Brown \"线性代数本质\"": "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
}

# 书籍作者映射
BOOK_AUTHORS = {
    "《GPT 图解》": "黄佳",
    "《大语言模型：基础与前沿》": "熊涛",
    "《动手构建大模型》": "待补充",
    "Build a Large Language Model (From Scratch)": "Sebastian Raschka",
    "《大模型RAG实战》": "待补充",
}


# ============================================================
# 解析函数
# ============================================================

def find_tree_codeblock(content: str) -> str:
    """从 markdown 中提取思维导图的代码块"""
    # 找到 "全文思维导图" 后面的代码块
    pos = content.find('全文思维导图')
    if pos == -1:
        return ""

    remaining = content[pos:]
    # 找到第一个 ```
    start = remaining.find('```')
    if start == -1:
        return ""
    # 找到对应的结束 ```
    end = remaining.find('```', start + 3)
    if end == -1:
        return ""

    return remaining[start + 3:end].strip()


def parse_roadmap_tree(content: str) -> list[dict]:
    """从思维导图代码块中解析树形结构，返回节点列表"""
    tree_text = find_tree_codeblock(content)
    if not tree_text:
        print("⚠️ 未找到思维导图代码块")
        return []

    lines = tree_text.split('\n')
    nodes = []

    # 根节点（第一行，没有树形字符）
    root_title = lines[0].strip()
    if root_title:
        nodes.append({
            "title": root_title,
            "parent_idx": -1,
            "depth": 0,
            "stage": None,
            "icon": extract_icon(root_title),
            "sort_order": 0,
        })

    # 用于记录每个深度最近添加的节点索引
    last_node_at_depth = {0: 0}

    for line in lines[1:]:
        # 查找树形连接符 ── 或 └──
        connector_match = re.search(r'[├└]──', line)
        if not connector_match:
            continue  # 纯竖线连接符，跳过

        pos = connector_match.start()
        depth = (pos // 4) + 1  # 每 4 个字符一个缩进层级

        # 提取标题（去除树形字符）
        title = line[pos + 4:].strip()
        if not title:
            continue

        # 提取图标
        icon = extract_icon(title)

        # 确定父节点
        parent_idx = last_node_at_depth.get(depth - 1, 0)

        # 确定 stage（继承自 depth=1 的祖先）
        stage = None
        if depth == 1:
            stage = title
        elif depth > 1:
            # 查找到 depth=1 的祖先
            ancestor_idx = parent_idx
            while ancestor_idx >= 0:
                ancestor = nodes[ancestor_idx]
                if ancestor["depth"] == 1:
                    stage = ancestor["title"]
                    break
                ancestor_idx = ancestor.get("parent_idx", -1)

        node = {
            "title": title,
            "parent_idx": parent_idx,
            "depth": depth,
            "stage": stage,
            "icon": icon,
            "sort_order": len([n for n in nodes if n["depth"] == depth and n.get("_true_parent") == parent_idx]),
        }
        node["_true_parent"] = parent_idx

        nodes.append(node)
        last_node_at_depth[depth] = len(nodes) - 1
        # 清除更深层的记录（因为当前节点开启了新的子层级）
        for d in list(last_node_at_depth.keys()):
            if d > depth:
                del last_node_at_depth[d]

    return nodes


def parse_papers(content: str) -> list[dict]:
    """从论文清单中解析论文"""
    papers = []
    seen_titles = set()

    # 三个表格的起始标记
    sections = [
        "### 基石论文（必读）",
        "### 架构与方法论文",
        "### 应用与前沿论文",
    ]

    for section in sections:
        rows = parse_markdown_table_rows(content, section)
        for row in rows:
            if len(row) < 4:
                continue
            # row: [序号, 论文名称, 年份, 核心贡献]
            title = strip_markdown_format(row[1])
            year_str = row[2].strip()
            try:
                year = int(year_str)
            except ValueError:
                year = 0

            if not title or title in seen_titles:
                continue
            seen_titles.add(title)

            meta = PAPER_META.get(title, {"author": "", "conference": ""})

            papers.append({
                "title": title,
                "year": year,
                "author": meta["author"],
                "conference": meta["conference"],
                "contribution": row[3].strip() if len(row) > 3 else "",
            })

    return papers


def parse_github_projects(content: str) -> list[dict]:
    """从 GitHub 项目汇总表格中解析项目"""
    section = "## 七、🛠️ 推荐 GitHub 项目汇总"
    rows = parse_markdown_table_rows(content, section)

    projects = []
    for row in rows:
        if len(row) < 3:
            continue
        # row: [项目名, Star, 定位, 链接]
        name = strip_markdown_format(row[0])
        stars_str = row[1].strip() if len(row) > 1 else ""
        url = extract_url_from_markdown(row[3]) if len(row) > 3 else None

        if not name:
            continue

        projects.append({
            "title": name,
            "stars": stars_str,
            "language": "Python",
            "description": row[2].strip() if len(row) > 2 else "",
            "url": url,
            "is_tried": False,
        })

    return projects


def parse_videos(content: str) -> list[dict]:
    """从神级资源推荐表格中解析视频资源"""
    section = "### 1.4 🎬 神级资源推荐"
    rows = parse_markdown_table_rows(content, section)

    videos = []
    for row in rows:
        if len(row) < 2:
            continue
        # row: [资源名, 说明, 链接/位置]
        title = strip_markdown_format(row[0])
        description = row[1].strip() if len(row) > 1 else ""
        link_text = row[2].strip() if len(row) > 2 else ""

        url = extract_url_from_markdown(link_text)
        platform = extract_platform(link_text)

        # 从说明中提取可能的作者
        author = ""
        if "Karpathy" in description or "Karpathy" in title:
            author = "Andrej Karpathy"
        elif "李沐" in description or "李沐" in title:
            author = "李沐"
        elif "李宏毅" in description or "李宏毅" in title:
            author = "李宏毅"
        elif "3Blue1Brown" in description or "3Blue1Brown" in title:
            author = "3Blue1Brown"
        elif "HuggingFace" in description or "HuggingFace" in title:
            author = "HuggingFace"

        if not title:
            continue

        videos.append({
            "title": title,
            "url": url,
            "platform": platform,
            "author": author,
            "description": description,
        })

    return videos


def parse_books(content: str) -> list[dict]:
    """从推荐书籍表格中解析书籍"""
    section = "## 📚 附录：推荐书籍"
    rows = parse_markdown_table_rows(content, section)

    books = []
    for row in rows:
        if len(row) < 1:
            continue
        # row: [书名, 说明]
        title = strip_markdown_format(row[0])
        description = row[1].strip() if len(row) > 1 else ""

        if not title:
            continue

        author = BOOK_AUTHORS.get(title, "待补充")

        books.append({
            "title": title,
            "author": author,
            "description": description,
        })

    return books


# ============================================================
# 主函数
# ============================================================

def main():
    # 读取 md 文件（项目根目录）
    project_root = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(project_root, "..", "LLM学习路线全面指南.md")
    md_path = os.path.normpath(md_path)

    if not os.path.exists(md_path):
        print(f"❌ 找不到文件: {md_path}")
        return

    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 初始化数据库
    init_db()
    db = SessionLocal()

    try:
        # 清空已有数据（按依赖顺序删除）
        db.query(Bookmark).delete()
        db.query(Note).delete()
        db.query(LearningProgress).delete()
        db.query(RoadmapNode).delete()
        db.query(Tag).delete()

        # ========================================
        # 1. 创建路线节点
        # ========================================
        nodes_data = parse_roadmap_tree(content)
        node_map = {}  # {temp_idx: RoadmapNode instance}

        # 第一遍：创建所有节点并分配临时 ID
        for i, nd in enumerate(nodes_data):
            node = RoadmapNode(
                title=nd["title"],
                depth=nd["depth"],
                stage=nd["stage"],
                icon=nd["icon"],
                sort_order=nd["sort_order"],
            )
            db.add(node)
            db.flush()  # 获取 id
            node_map[i] = node

        # 第二遍：设置 parent_id
        for i, nd in enumerate(nodes_data):
            if nd["parent_idx"] >= 0:
                node_map[i].parent_id = node_map[nd["parent_idx"]].id

        db.flush()
        node_count = len(nodes_data)
        print(f"✅ 路线节点: {node_count}")

        # ========================================
        # 2. 为每个节点创建进度记录
        # ========================================
        for node in node_map.values():
            progress = LearningProgress(node_id=node.id, status="not_started")
            db.add(progress)

        db.flush()
        print(f"✅ 学习进度记录: {node_count}")

        # ========================================
        # 3. 创建论文收藏
        # ========================================
        papers_data = parse_papers(content)
        paper_count = 0
        for p in papers_data:
            bookmark = Bookmark(
                type="paper",
                title=p["title"],
                url=PAPER_URLS.get(p["title"], ""),
                notes=p.get("contribution", ""),
                _extra_fields=json.dumps({
                    "author": p.get("author", ""),
                    "year": p.get("year", 0),
                    "conference": p.get("conference", ""),
                    "read_status": "unread",
                }, ensure_ascii=False),
            )
            db.add(bookmark)
            paper_count += 1

        db.flush()
        print(f"✅ 论文收藏: {paper_count}")

        # ========================================
        # 4. 创建 GitHub 项目收藏
        # ========================================
        github_data = parse_github_projects(content)
        github_count = 0
        for g in github_data:
            bookmark = Bookmark(
                type="github",
                title=g["title"],
                url=g.get("url", ""),
                notes=g.get("description", ""),
                _extra_fields=json.dumps({
                    "stars": g.get("stars", ""),
                    "language": g.get("language", "Python"),
                    "is_tried": False,
                }, ensure_ascii=False),
            )
            db.add(bookmark)
            github_count += 1

        db.flush()
        print(f"✅ GitHub 项目: {github_count}")

        # ========================================
        # 5. 创建视频收藏
        # ========================================
        videos_data = parse_videos(content)
        video_count = 0
        for v in videos_data:
            url = v.get("url") or VIDEO_URLS.get(v["title"], "")
            bookmark = Bookmark(
                type="video",
                title=v["title"],
                url=url,
                notes=v.get("description", ""),
                _extra_fields=json.dumps({
                    "platform": v.get("platform", ""),
                    "author": v.get("author", ""),
                }, ensure_ascii=False),
            )
            db.add(bookmark)
            video_count += 1

        db.flush()
        print(f"✅ 视频资源: {video_count}")

        # ========================================
        # 6. 创建书籍收藏
        # ========================================
        books_data = parse_books(content)
        book_count = 0
        for b in books_data:
            bookmark = Bookmark(
                type="book",
                title=b["title"],
                url=BOOK_URLS.get(b["title"], ""),
                notes=b.get("description", ""),
                _extra_fields=json.dumps({
                    "author": b.get("author", ""),
                    "read_status": "unread",
                }, ensure_ascii=False),
            )
            db.add(bookmark)
            book_count += 1

        db.flush()
        print(f"✅ 书籍: {book_count}")

        # ========================================
        # 提交事务
        # ========================================
        db.commit()
        print()
        print("=" * 50)
        print("🎉 种子数据导入完成！")
        print(f"   - 路线节点: {node_count}")
        print(f"   - 学习进度: {node_count}")
        print(f"   - 论文收藏: {paper_count}")
        print(f"   - GitHub 项目: {github_count}")
        print(f"   - 视频资源: {video_count}")
        print(f"   - 书籍: {book_count}")
        print(f"   - 总计收藏: {paper_count + github_count + video_count + book_count}")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
