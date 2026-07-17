"""Roadmap API 测试"""
import pytest


class TestRoadmapTree:
    """树形结构相关测试"""

    def test_get_empty_tree(self, client):
        """空数据库返回空列表"""
        response = client.get("/api/roadmap/tree")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_root_node(self, client):
        """POST 创建根节点，验证 201 + depth=0 + 自动创建 progress"""
        payload = {
            "title": "根节点",
            "description": "这是一个根节点",
            "sort_order": 0,
            "stage": "基础阶段",
            "icon": "🚀",
        }
        response = client.post("/api/roadmap/nodes", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "根节点"
        assert data["depth"] == 0
        assert data["parent_id"] is None
        assert data["status"] == "not_started"
        assert data["stage"] == "基础阶段"

    def test_create_child_node(self, client):
        """创建子节点，验证 parent_id + depth 继承"""
        # 先创建根节点
        root_payload = {"title": "根节点", "stage": "基础阶段"}
        root_resp = client.post("/api/roadmap/nodes", json=root_payload)
        root_id = root_resp.json()["id"]

        # 创建子节点
        child_payload = {
            "title": "子节点",
            "parent_id": root_id,
        }
        response = client.post("/api/roadmap/nodes", json=child_payload)
        assert response.status_code == 201
        data = response.json()
        assert data["parent_id"] == root_id
        assert data["depth"] == 1
        assert data["stage"] == "基础阶段"  # 继承父节点的 stage

    def test_get_tree(self, client):
        """创建3个节点后获取树，验证嵌套结构"""
        # 创建根节点
        root_resp = client.post("/api/roadmap/nodes", json={"title": "根"})
        root_id = root_resp.json()["id"]

        # 创建两个子节点（不同 sort_order）
        client.post("/api/roadmap/nodes", json={
            "title": "子1", "parent_id": root_id, "sort_order": 0
        })
        client.post("/api/roadmap/nodes", json={
            "title": "子2", "parent_id": root_id, "sort_order": 1
        })

        # 获取树
        response = client.get("/api/roadmap/tree")
        assert response.status_code == 200
        tree = response.json()
        assert len(tree) == 1
        assert tree[0]["title"] == "根"
        assert len(tree[0]["children"]) == 2
        assert tree[0]["children"][0]["title"] == "子1"
        assert tree[0]["children"][1]["title"] == "子2"

    def test_get_node_detail(self, client):
        """获取节点详情含 progress"""
        # 创建节点
        root_resp = client.post("/api/roadmap/nodes", json={"title": "测试节点"})
        node_id = root_resp.json()["id"]

        # 获取详情
        response = client.get(f"/api/roadmap/nodes/{node_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "测试节点"
        assert data["progress"] is not None
        assert data["progress"]["status"] == "not_started"
        assert data["linked_notes"] == []
        assert data["linked_bookmarks"] == []

    def test_update_node(self, client):
        """PUT 更新标题"""
        # 创建节点
        resp = client.post("/api/roadmap/nodes", json={"title": "旧标题"})
        node_id = resp.json()["id"]

        # 更新
        response = client.put(f"/api/roadmap/nodes/{node_id}", json={"title": "新标题"})
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "新标题"

    def test_delete_node_cascade(self, client):
        """删除父节点，子节点变为根节点（外键约束未设置 ON DELETE CASCADE）"""
        # 创建父节点
        parent_resp = client.post("/api/roadmap/nodes", json={"title": "父"})
        parent_id = parent_resp.json()["id"]

        # 创建子节点
        child_resp = client.post("/api/roadmap/nodes", json={"title": "子", "parent_id": parent_id})
        child_id = child_resp.json()["id"]

        # 删除父节点
        response = client.delete(f"/api/roadmap/nodes/{parent_id}")
        assert response.status_code == 204

        # 验证父节点已删除（404）
        get_resp = client.get(f"/api/roadmap/nodes/{parent_id}")
        assert get_resp.status_code == 404

        # 子节点仍然存在（变为孤儿节点，在树中显示为根节点）
        tree_resp = client.get("/api/roadmap/tree")
        tree = tree_resp.json()
        assert len(tree) == 1
        assert tree[0]["id"] == child_id

    def test_update_progress(self, client):
        """设为 in_progress，验证 started_at；设为 completed，验证 completed_at"""
        # 创建节点
        resp = client.post("/api/roadmap/nodes", json={"title": "进度测试"})
        node_id = resp.json()["id"]

        # 设为 in_progress
        response = client.put(
            f"/api/roadmap/nodes/{node_id}/progress",
            json={"status": "in_progress"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["started_at"] is not None

        # 设为 completed
        response = client.put(
            f"/api/roadmap/nodes/{node_id}/progress",
            json={"status": "completed"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    def test_node_not_found(self, client):
        """访问不存在节点返回404"""
        response = client.get("/api/roadmap/nodes/99999")
        assert response.status_code == 404
        assert response.json()["detail"] == "节点不存在"

    def test_tree_sort_order(self, client):
        """验证子节点按 sort_order 排序"""
        # 创建根节点
        root_resp = client.post("/api/roadmap/nodes", json={"title": "根"})
        root_id = root_resp.json()["id"]

        # 创建三个子节点，sort_order 乱序
        client.post("/api/roadmap/nodes", json={
            "title": "C", "parent_id": root_id, "sort_order": 2
        })
        client.post("/api/roadmap/nodes", json={
            "title": "A", "parent_id": root_id, "sort_order": 0
        })
        client.post("/api/roadmap/nodes", json={
            "title": "B", "parent_id": root_id, "sort_order": 1
        })

        # 获取树
        response = client.get("/api/roadmap/tree")
        tree = response.json()
        children = tree[0]["children"]
        assert len(children) == 3
        assert children[0]["title"] == "A"
        assert children[1]["title"] == "B"
        assert children[2]["title"] == "C"

    def test_create_node_with_nonexistent_parent(self, client):
        """创建子节点时父节点不存在返回404"""
        payload = {"title": "孤儿节点", "parent_id": 99999}
        response = client.post("/api/roadmap/nodes", json=payload)
        assert response.status_code == 404
        assert response.json()["detail"] == "父节点不存在"
