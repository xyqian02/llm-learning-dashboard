from pydantic import BaseModel, Field
from typing import Optional


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = "#6366f1"


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
