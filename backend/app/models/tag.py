from sqlalchemy import Column, Integer, String
from app.database import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7), default="#6366f1")  # hex 色值
