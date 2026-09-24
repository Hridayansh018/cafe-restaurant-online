from typing import Optional, Literal
from pydantic import BaseModel, Field


TableStatus = Literal["vacant", "occupied", "billing_requested", "reserved"]


class PositionSchema(BaseModel):
    x: int = 100
    y: int = 100


class TableSchema(BaseModel):
    table_id: str
    label: str
    capacity: int = 4
    zone: str = "Indoor"
    qr_token: str
    qr_issued_at: int  # Epoch ms
    qr_version: int = 1
    status: TableStatus = "vacant"
    current_session_id: Optional[str] = None
    position: PositionSchema = Field(default_factory=PositionSchema)
    call_waiter_active: Optional[bool] = False
    call_waiter_reason: Optional[str] = None
    call_waiter_time: Optional[int] = None


class TableCreateSchema(BaseModel):
    label: str
    capacity: int = 4
    zone: str = "Indoor"
    status: TableStatus = "vacant"
    position: Optional[PositionSchema] = None


class TableUpdateSchema(BaseModel):
    label: Optional[str] = None
    capacity: Optional[int] = None
    zone: Optional[str] = None
    status: Optional[TableStatus] = None
    current_session_id: Optional[str] = None
    position: Optional[PositionSchema] = None
    call_waiter_active: Optional[bool] = None
    call_waiter_reason: Optional[str] = None
    call_waiter_time: Optional[int] = None
    pos_x: Optional[int] = None
    pos_y: Optional[int] = None
    qr_token: Optional[str] = None
    qr_issued_at: Optional[int] = None
    qr_version: Optional[int] = None
