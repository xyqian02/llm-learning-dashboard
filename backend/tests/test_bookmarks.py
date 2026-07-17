"""Bookmarks API 测试"""
import pytest


class TestBookmarks:
    """收藏 API 测试"""

    def test_create_paper(self, client):
        """创建论文，extra_fields 正确"""
        payload = {
            "type": "paper",
            "title": "Attention Is All You Need",
            "url": "https://arxiv.org/abs/1706.03762",
            "extra_fields": {
                "author": "Vaswani et al.",
                "year": 2017,
                "conference": "NeurIPS",
                "read_status": "unread",
            },
        }
        response = client.post("/api/bookmarks/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "paper"
        assert data["title"] == "Attention Is All You Need"
        assert data["extra_fields"]["author"] == "Vaswani et al."
        assert data["extra_fields"]["year"] == 2017

    def test_get_by_type(self, client):
        """按类型筛选"""
        # 创建不同类型的收藏
        client.post("/api/bookmarks/", json={
            "type": "paper", "title": "论文A", "extra_fields": {"year": 2023}
        })
        client.post("/api/bookmarks/", json={
            "type": "video", "title": "视频A", "extra_fields": {"platform": "YouTube"}
        })
        client.post("/api/bookmarks/", json={
            "type": "paper", "title": "论文B", "extra_fields": {"year": 2024}
        })

        # 按 paper 类型筛选
        response = client.get("/api/bookmarks/?type=paper")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        titles = [item["title"] for item in data["items"]]
        assert "论文A" in titles
        assert "论文B" in titles

        # 按 video 类型筛选
        response = client.get("/api/bookmarks/?type=video")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "视频A"

    def test_create_github(self, client):
        """创建 GitHub 收藏"""
        payload = {
            "type": "github",
            "title": "transformers",
            "url": "https://github.com/huggingface/transformers",
            "extra_fields": {
                "stars": "100k+",
                "description": "State-of-the-art ML for PyTorch",
            },
        }
        response = client.post("/api/bookmarks/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "github"
        assert data["title"] == "transformers"
        assert data["extra_fields"]["stars"] == "100k+"

    def test_update_bookmark(self, client):
        """更新收藏"""
        # 创建
        resp = client.post("/api/bookmarks/", json={
            "type": "book", "title": "旧书名",
            "extra_fields": {"author": "旧作者"},
        })
        bm_id = resp.json()["id"]

        # 更新
        response = client.put(f"/api/bookmarks/{bm_id}", json={
            "title": "新书名",
            "extra_fields": {"author": "新作者"},
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "新书名"
        assert data["extra_fields"]["author"] == "新作者"

    def test_delete_bookmark(self, client):
        """删除收藏"""
        resp = client.post("/api/bookmarks/", json={
            "type": "book", "title": "待删除",
        })
        bm_id = resp.json()["id"]

        response = client.delete(f"/api/bookmarks/{bm_id}")
        assert response.status_code == 204

        # 验证已删除
        get_resp = client.get(f"/api/bookmarks/{bm_id}")
        assert get_resp.status_code == 404

    def test_bookmark_not_found(self, client):
        """访问不存在的收藏返回404"""
        response = client.get("/api/bookmarks/99999")
        assert response.status_code == 404

    def test_bookmark_search(self, client):
        """模糊搜索标题"""
        client.post("/api/bookmarks/", json={
            "type": "paper", "title": "GPT论文",
        })
        client.post("/api/bookmarks/", json={
            "type": "paper", "title": "BERT论文",
        })

        response = client.get("/api/bookmarks/?search=GPT")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "GPT论文"
