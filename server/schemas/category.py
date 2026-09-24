from typing import Optional
from pydantic import BaseModel


class CategorySchema(BaseModel):
    category_id: str
    name: str
    sort_order: int = 0
    is_active: bool = True


class CategoryCreateSchema(BaseModel):
    name: str
    sort_order: int = 0
    is_active: bool = True


class CategoryUpdateSchema(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
