# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LLM Learning Dashboard — 大模型学习路线交互式管理工具。将 `LLM学习路线全面指南.md` 转为可交互的本地 Web 应用。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| 状态/数据 | Zustand + TanStack Query |
| 动效 | Framer Motion |
| 图表 | Recharts |
| Markdown | @uiw/react-md-editor + react-markdown |
| 后端 | FastAPI (Python 3.11) + SQLAlchemy 2.0 |
| 数据库 | SQLite |
| 版本控制 | Git + GitHub (`llm-learning-dashboard`) |

## Python 环境

使用 Anaconda base 环境。所有 Python 命令前先激活：

```bash
source /c/ProgramData/anaconda3/etc/profile.d/conda.sh && conda activate base && <实际命令>
```

## 常用命令

```bash
# 一键启动
start.bat

# 手动启动后端
cd backend && source /c/ProgramData/anaconda3/etc/profile.d/conda.sh && conda activate base && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 手动启动前端
cd frontend && npm run dev

# 安装后端依赖
cd backend && source /c/ProgramData/anaconda3/etc/profile.d/conda.sh && conda activate base && pip install -r requirements.txt

# 安装前端依赖
cd frontend && npm install

# 种子数据填充
cd backend && source /c/ProgramData/anaconda3/etc/profile.d/conda.sh && conda activate base && python seed_data.py

# 运行全量后端测试
cd backend && source /c/ProgramData/anaconda3/etc/profile.d/conda.sh && conda activate base && python -m pytest tests/ -v

# 运行全量测试+覆盖率
cd backend && source /c/ProgramData/anaconda3/etc/profile.d/conda.sh && conda activate base && python -m pytest tests/ -v --cov=app --cov-report=term

# 运行单个测试模块
cd backend && source /c/ProgramData/anaconda3/etc/profile.d/conda.sh && conda activate base && python -m pytest tests/test_roadmap.py -v
```

## 架构

```
frontend/                    # React SPA (Vite + shadcn/ui + Tailwind)
  src/
    features/                # 按功能模块：home/dashboard/roadmap/notes/bookmarks/settings
    components/              # ui/(shadcn), layout/, shared/
    hooks/                   # TanStack Query hooks
    stores/                  # Zustand stores

backend/                     # FastAPI REST API
  app/
    main.py                  # 入口，CORS 配置
    database.py              # SQLAlchemy engine + session
    models/                  # ORM: roadmap.py, note.py, bookmark.py, tag.py
    schemas/                 # Pydantic 请求/响应模型
    routers/                 # API 路由: roadmap, notes, bookmarks, dashboard, settings
    services/                # 业务逻辑: import_service, export_service, backup_service
  tests/                     # pytest + httpx TestClient
```

数据流：`React → TanStack Query → FastAPI → SQLAlchemy → SQLite`

## 路由与页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 主界面 | 全屏入口页，品牌动画 + 概览卡片 |
| `/dashboard` | 仪表盘 | 进度统计、阶段完成率、活动时间线 |
| `/roadmap` | 学习路线 | 左侧树形导航 + 右侧节点详情面板 |
| `/notes` | 笔记 | 列表 + Markdown 编辑器/预览 |
| `/bookmarks` | 收藏 | 论文/视频/GitHub/书籍四类型管理 |
| `/settings` | 设置 | 备份恢复、导入导出 |

## 关键设计决策

- **用户类型**：个人单机，无多用户系统
- **学习路线**：预设（从 md 导入）+ 可自由增删改 + 支持导入导出
- **进度跟踪**：三态（未开始/进行中/已完成），自动记录完成时间
- **收藏与节点关联**：每个收藏可关联多个学习节点，节点详情页可查看关联资源
- **扩展字段**：bookmarks 表用 JSON `extra_fields` 存各类型的差异化字段
- **无需计时器**：不记录学习时长

## Git 工作流

测试门控提交（详见 `测试方案.md`）：

```
开发 → Gate 测试通过 → git add -A → git commit -m "gate(N): ..." → git push origin main
```

每个阶段测试通过后立即提交推送，提交信息格式：`gate(N): <阶段名称> — <简要描述>`。

不提交 `backend/data/*.db`、`node_modules/`、`__pycache__/`（已配置 .gitignore）。

## 重要文档

- `项目方案大纲.md` — 完整技术方案、数据模型、API 设计、任务拆分
- `测试方案.md` — 10 道 Gate 测试关卡，逐阶段验证
- `LLM学习路线全面指南.md` — 种子数据源，应用启动时解析导入
