"""Dashboard API 测试"""
import pytest


class TestDashboard:
    """仪表盘 API 测试"""

    def test_overview_empty(self, client):
        """空数据库统计"""
        response = client.get("/api/dashboard/overview")
        assert response.status_code == 200
        data = response.json()
        assert data["total_progress"] == 0.0
        assert data["in_progress_count"] == 0
        assert data["recent_days"] == 0

    def test_overview_with_data(self, client):
        """创建节点+进度后统计正确"""
        # 创建 2 个节点
        node1 = client.post("/api/roadmap/nodes", json={"title": "节点1"}).json()
        node2 = client.post("/api/roadmap/nodes", json={"title": "节点2"}).json()

        # 节点1设为已完成
        client.put(
            f"/api/roadmap/nodes/{node1['id']}/progress",
            json={"status": "completed"},
        )
        # 节点2设为进行中
        client.put(
            f"/api/roadmap/nodes/{node2['id']}/progress",
            json={"status": "in_progress"},
        )

        response = client.get("/api/dashboard/overview")
        assert response.status_code == 200
        data = response.json()
        # 1/2 = 50%
        assert data["total_progress"] == 50.0
        assert data["in_progress_count"] == 1

    def test_stage_progress(self, client):
        """阶段进度统计正确"""
        # 创建两个阶段的节点
        node1 = client.post("/api/roadmap/nodes", json={
            "title": "基础", "stage": "基础阶段"
        }).json()
        node2 = client.post("/api/roadmap/nodes", json={
            "title": "进阶", "stage": "进阶阶段"
        }).json()

        # 节点1完成
        client.put(
            f"/api/roadmap/nodes/{node1['id']}/progress",
            json={"status": "completed"},
        )

        response = client.get("/api/dashboard/stage-progress")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # 基础阶段 1/1 = 100%
        stage_basic = [s for s in data if s["stage"] == "基础阶段"][0]
        assert stage_basic["total"] == 1
        assert stage_basic["completed"] == 1
        assert stage_basic["percentage"] == 100.0

        # 进阶阶段 0/1 = 0%
        stage_adv = [s for s in data if s["stage"] == "进阶阶段"][0]
        assert stage_adv["total"] == 1
        assert stage_adv["completed"] == 0
        assert stage_adv["percentage"] == 0.0

    def test_recent_activity(self, client):
        """最近活动返回数据"""
        # 创建节点并更新进度
        node = client.post("/api/roadmap/nodes", json={"title": "活动节点"}).json()
        client.put(
            f"/api/roadmap/nodes/{node['id']}/progress",
            json={"status": "in_progress"},
        )

        response = client.get("/api/dashboard/recent-activity")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["type"] == "progress"
        assert data[0]["node_title"] == "活动节点"
