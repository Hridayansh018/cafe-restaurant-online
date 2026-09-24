from typing import Optional, Literal
from pydantic import BaseModel

StaffRole = Literal["kitchen", "waiter", "cashier", "admin"]


class StaffSchema(BaseModel):
    staff_id: str
    name: str
    role: StaffRole
    phone: str = ""
    is_active: bool = True


class StaffCreateSchema(BaseModel):
    name: str
    role: StaffRole
    phone: str = ""
    pin: Optional[str] = None
    is_active: bool = True


class StaffUpdateSchema(BaseModel):
    name: Optional[str] = None
    role: Optional[StaffRole] = None
    phone: Optional[str] = None
    pin: Optional[str] = None
    is_active: Optional[bool] = None
