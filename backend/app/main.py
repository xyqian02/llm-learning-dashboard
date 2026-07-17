from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db

app = FastAPI(
    title="LLM Learning Dashboard API",
    description="大模型学习路线管理后端服务",
    version="1.0.0",
)

# CORS 配置：允许前端开发服务器访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """应用启动时初始化数据库"""
    init_db()


@app.get("/api/health")
def health_check():
    """健康检查端点"""
    return {"status": "ok", "message": "LLM Learning Dashboard API is running"}
