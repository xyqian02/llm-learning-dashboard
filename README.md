# 🧠 LLM Learning Dashboard

大模型学习路线交互式管理工具

[![GitHub](https://img.shields.io/badge/github-xyqian02%2Fllm--learning--dashboard-blue)](https://github.com/xyqian02/llm-learning-dashboard)

## 功能

- 🗺️ **学习路线管理**：树形结构的学习路线，支持增删改查、导入导出
- 📊 **进度跟踪**：三态进度管理（未开始/进行中/已完成），自动记录时间
- 📝 **学习笔记**：Markdown 编辑器，支持标签分类、关联学习节点
- ⭐ **资源收藏**：论文/视频/GitHub/书籍分类管理，一键跳转原文
- 📈 **数据统计**：仪表盘概览，阶段完成率，学习活动时间线
- 💾 **数据安全**：一键备份恢复，支持导入导出

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| 后端 | FastAPI (Python 3.11) |
| 数据库 | SQLite + SQLAlchemy |

## 快速开始

### 环境要求
- Python 3.11+ (推荐 Anaconda)
- Node.js 18+
- Git

### 安装

```bash
# 1. 克隆项目
git clone https://github.com/xyqian02/llm-learning-dashboard.git
cd llm-learning-dashboard

# 2. 安装后端依赖
cd backend
pip install -r requirements.txt

# 3. 初始化种子数据
python seed_data.py

# 4. 安装前端依赖
cd ../frontend
npm install

# 5. 启动（双击 start.bat 或手动启动）
cd ..
start.bat
```

### 启动后访问
- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 目录结构

```
├── frontend/          # React 前端
│   └── src/
│       ├── components/ # 通用组件
│       ├── features/   # 功能模块（dashboard/roadmap/notes/bookmarks/settings）
│       ├── stores/     # Zustand 状态
│       └── lib/        # 工具函数
├── backend/           # FastAPI 后端
│   └── app/
│       ├── models/     # ORM 数据模型
│       ├── routers/    # API 路由
│       ├── schemas/    # Pydantic 模型
│       └── services/   # 业务逻辑（导入/导出）
└── start.bat          # 一键启动脚本
```

## 使用指南

### 学习路线
- 点击左侧树节点查看详情
- 右键节点弹出操作菜单
- 在详情面板切换学习进度
- 支持 .md 文件导入导出

### 笔记
- 左侧列表搜索和标签筛选
- 右侧 Markdown 编辑器
- 关联学习节点建立联系

### 收藏
- 切换 Tab 查看不同类型
- 点击链接图标跳转原文
- 论文支持阅读状态跟踪

### 设置
- 数据备份：导出全量 JSON
- 数据恢复：上传备份文件
- 导入导出路线、笔记、收藏

## 运行测试

```bash
cd backend
python -m pytest tests/ -v
python -m pytest tests/ -v --cov=app --cov-report=term
```

## License

MIT
