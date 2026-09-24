from typing import Optional
from pydantic import BaseModel


class CustomerSchema(BaseModel):
    customer_id: str
    phone: str
    name: str = ""
    email: str = ""
    marketing_opt_in: bool = False
    visit_count: int = 0
    total_spent: float = 0.0
    last_visit: Optional[int] = None  # Epoch ms
    created_at: int  # Epoch ms


class CustomerCreateSchema(BaseModel):
    phone: str
    name: str = ""
    email: str = ""
    marketing_opt_in: bool = False


class CustomerUpdateSchema(BaseModel):
    phone: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    marketing_opt_in: Optional[bool] = None
    visit_count: Optional[int] = None
    total_spent: Optional[float] = None
    last_visit: Optional[int] = None
