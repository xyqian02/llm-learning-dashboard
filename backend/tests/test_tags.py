"""Tags API 测试"""
import pytest


class TestTags:
    """标签 API 测试"""

    def test_create_tag(self, client):
        """创建标签"""
        payload = {"name": "深度学习", "color": "#ff0000"}
        response = client.post("/api/tags/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "深度学习"
        assert data["color"] == "#ff0000"

    def test_duplicate_tag(self, client):
        """重复标签返回 409"""
        client.post("/api/tags/", json={"name": "重复标签"})
        # 再次创建同名标签
        response = client.post("/api/tags/", json={"name": "重复标签"})
        assert response.status_code == 409
        assert "已存在" in response.json()["detail"]

    def test_delete_tag(self, client):
        """删除标签"""
        resp = client.post("/api/tags/", json={"name": "待删除"})
        tag_id = resp.json()["id"]

        response = client.delete(f"/api/tags/{tag_id}")
        assert response.status_code == 204

        # 验证已删除（列表不会再包含）
        list_resp = client.get("/api/tags/")
        tags = list_resp.json()
        assert all(t["id"] != tag_id for t in tags)

    def test_list_tags_with_count(self, client):
        """标签列表含使用计数"""
        # 创建标签
        tag = client.post("/api/tags/", json={"name": "计数标签"}).json()

        # 创建笔记并关联标签
        client.post("/api/notes/", json={
            "title": "带标签笔记",
            "content": "...",
            "tag_ids": [tag["id"]],
        })

        # 获取标签列表
        response = client.get("/api/tags/")
        assert response.status_code == 200
        tags = response.json()
        found = [t for t in tags if t["id"] == tag["id"]]
        assert len(found) == 1
        assert found[0]["used_count"] == 1
