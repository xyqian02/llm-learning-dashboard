"""Settings API 测试"""
import pytest
import json
import io


class TestSettings:
    """设置 API 测试（备份、恢复、导入、导出）"""

    def test_backup(self, client):
        """导出备份 - 创建数据后导出"""
        # 创建一些数据
        client.post("/api/roadmap/nodes", json={"title": "节点1"})
        client.post("/api/notes/", json={"title": "笔记1", "content": "内容"})
        client.post("/api/tags/", json={"name": "标签1"})
        client.post("/api/bookmarks/", json={
            "type": "paper", "title": "论文1", "extra_fields": {"year": 2023}
        })

        response = client.get("/api/settings/backup")
        assert response.status_code == 200
        # 验证是 JSON 响应
        content = response.content
        assert len(content) > 0
        data = json.loads(content)
        assert "roadmap_nodes" in data
        assert "notes" in data
        assert "tags" in data
        assert "bookmarks" in data
        assert len(data["roadmap_nodes"]) >= 1
        assert len(data["notes"]) >= 1

    def test_restore(self, client):
        """导入恢复 - 先备份数据，清空后恢复"""
        # 创建测试数据
        client.post("/api/roadmap/nodes", json={"title": "恢复节点"})
        node_resp = client.post("/api/roadmap/nodes", json={"title": "子节点"})

        # 备份
        backup_resp = client.get("/api/settings/backup")
        backup_content = backup_resp.content

        # 通过创建新节点验证当前有数据
        tree_before = client.get("/api/roadmap/tree").json()
        assert len(tree_before) >= 1

        # 恢复（需要上传备份文件）
        response = client.post(
            "/api/settings/restore",
            files={"file": ("backup.json", io.BytesIO(backup_content), "application/json")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "恢复" in data["message"]

    def test_import_roadmap_preview(self, client):
        """上传 md 文件导入 - 预览模式"""
        md_content = """# 学习路线

## 基础阶段
### Transformer
#### Attention 机制
"""
        response = client.post(
            "/api/settings/import-roadmap",
            files={"file": ("test.md", io.BytesIO(md_content.encode("utf-8")), "text/markdown")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["preview"] is True
        assert "total_nodes" in data

    def test_import_roadmap_confirm(self, client):
        """上传 md 文件并确认导入"""
        md_content = """# 学习路线

## 基础阶段
### Transformer
#### Attention 机制
"""
        response = client.post(
            "/api/settings/import-roadmap?confirm=true",
            files={"file": ("test.md", io.BytesIO(md_content.encode("utf-8")), "text/markdown")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["nodes_count"] > 0

        # 验证数据已导入
        tree = client.get("/api/roadmap/tree").json()
        assert len(tree) > 0

    def test_export_roadmap(self, client):
        """导出思维导图"""
        # 先创建节点
        client.post("/api/roadmap/nodes", json={"title": "根节点"})

        response = client.get("/api/settings/export-roadmap")
        assert response.status_code == 200
        content = response.content.decode("utf-8")
        assert "根节点" in content
        assert "LLM" in content

    def test_export_bookmarks(self, client):
        """导出收藏"""
        # 创建论文收藏
        client.post("/api/bookmarks/", json={
            "type": "paper",
            "title": "测试论文",
            "extra_fields": {"author": "作者", "year": 2024},
        })

        response = client.get("/api/settings/export-bookmarks?type=paper")
        assert response.status_code == 200
        content = response.content.decode("utf-8")
        assert "测试论文" in content

    def test_export_bookmarks_invalid_type(self, client):
        """导出收藏 - 无效类型返回400"""
        response = client.get("/api/settings/export-bookmarks?type=invalid")
        assert response.status_code == 400

    def test_export_notes(self, client):
        """导出笔记"""
        client.post("/api/notes/", json={"title": "测试笔记", "content": "笔记内容"})

        response = client.get("/api/settings/export-notes")
        assert response.status_code == 200
        content = response.content.decode("utf-8")
        assert "测试笔记" in content
        assert "笔记内容" in content

    def test_restore_empty_backup(self, client):
        """恢复空备份不报错"""
        empty_backup = json.dumps({
            "roadmap_nodes": [],
            "learning_progress": [],
            "notes": [],
            "note_node_links": [],
            "bookmarks": [],
            "bookmark_node_links": [],
            "tags": [],
            "note_tags": [],
            "bookmark_tags": [],
        })

        response = client.post(
            "/api/settings/restore",
            files={"file": ("empty.json", io.BytesIO(empty_backup.encode("utf-8")), "application/json")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
