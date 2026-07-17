"""Notes API 测试"""
import pytest


class TestNotes:
    """笔记 API 测试"""

    def test_create_note(self, client):
        """创建笔记，验证 201"""
        payload = {
            "title": "测试笔记",
            "content": "这是一篇测试笔记的内容",
        }
        response = client.post("/api/notes/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "测试笔记"
        assert data["content"] == "这是一篇测试笔记的内容"
        assert data["linked_nodes"] == []
        assert data["tags"] == []

    def test_get_notes_empty(self, client):
        """空列表"""
        response = client.get("/api/notes/")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_get_notes_with_data(self, client):
        """创建笔记后列表含数据"""
        client.post("/api/notes/", json={"title": "笔记A", "content": "内容A"})
        client.post("/api/notes/", json={"title": "笔记B", "content": "内容B"})

        response = client.get("/api/notes/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2
        titles = [item["title"] for item in data["items"]]
        assert "笔记B" in titles  # 按更新时间降序，最新的在前
        assert "笔记A" in titles

    def test_search_notes(self, client):
        """搜索关键词过滤"""
        client.post("/api/notes/", json={"title": "Python学习", "content": "Python基础"})
        client.post("/api/notes/", json={"title": "JavaScript入门", "content": "JS教程"})

        # 搜索 Python
        response = client.get("/api/notes/?search=Python")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Python学习"

    def test_get_note_detail(self, client):
        """详情含 linked_nodes 和 tags"""
        # 创建标签
        tag_resp = client.post("/api/tags/", json={"name": "LLM", "color": "#ff0000"})
        tag_id = tag_resp.json()["id"]

        # 创建节点
        node_resp = client.post("/api/roadmap/nodes", json={"title": "Transformer"})
        node_id = node_resp.json()["id"]

        # 创建笔记（关联节点和标签）
        payload = {
            "title": "Transformer笔记",
            "content": "Attention is all you need...",
            "linked_node_ids": [node_id],
            "tag_ids": [tag_id],
        }
        resp = client.post("/api/notes/", json=payload)
        note_id = resp.json()["id"]

        # 获取详情
        response = client.get(f"/api/notes/{note_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Transformer笔记"
        assert len(data["linked_nodes"]) == 1
        assert data["linked_nodes"][0]["id"] == node_id
        assert data["linked_nodes"][0]["title"] == "Transformer"
        assert len(data["tags"]) == 1
        assert data["tags"][0]["name"] == "LLM"

    def test_update_note(self, client):
        """更新内容"""
        resp = client.post("/api/notes/", json={"title": "旧标题", "content": "旧内容"})
        note_id = resp.json()["id"]

        response = client.put(f"/api/notes/{note_id}", json={"title": "新标题", "content": "新内容"})
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "新标题"
        assert data["content"] == "新内容"

    def test_delete_note(self, client):
        """删除笔记"""
        resp = client.post("/api/notes/", json={"title": "待删除", "content": "..."})
        note_id = resp.json()["id"]

        response = client.delete(f"/api/notes/{note_id}")
        assert response.status_code == 204

        # 验证已删除
        get_resp = client.get(f"/api/notes/{note_id}")
        assert get_resp.status_code == 404

    def test_link_nodes(self, client):
        """关联学习节点，验证关联表写入"""
        # 创建节点
        node1_resp = client.post("/api/roadmap/nodes", json={"title": "节点1"})
        node2_resp = client.post("/api/roadmap/nodes", json={"title": "节点2"})
        node1_id = node1_resp.json()["id"]
        node2_id = node2_resp.json()["id"]

        # 创建笔记并关联两个节点
        payload = {
            "title": "关联笔记",
            "content": "关联了两个节点",
            "linked_node_ids": [node1_id, node2_id],
        }
        resp = client.post("/api/notes/", json=payload)
        note_id = resp.json()["id"]

        # 验证关联
        detail = client.get(f"/api/notes/{note_id}").json()
        linked_ids = [n["id"] for n in detail["linked_nodes"]]
        assert node1_id in linked_ids
        assert node2_id in linked_ids

        # 验证从节点详情也能看到笔记关联
        node_detail = client.get(f"/api/roadmap/nodes/{node1_id}").json()
        assert len(node_detail["linked_notes"]) == 1
        assert node_detail["linked_notes"][0]["id"] == note_id

    def test_note_not_found(self, client):
        """访问不存在的笔记返回404"""
        response = client.get("/api/notes/99999")
        assert response.status_code == 404

    def test_notes_pagination(self, client):
        """分页功能"""
        for i in range(5):
            client.post("/api/notes/", json={"title": f"笔记{i}", "content": f"内容{i}"})

        response = client.get("/api/notes/?page=1&page_size=2")
        data = response.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2
