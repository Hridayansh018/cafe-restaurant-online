from typing import Optional, List, Literal
from pydantic import BaseModel, Field

PaymentMode = Literal["online_upi", "online_card", "counter_cash", "counter_card"]
PaymentStatus = Literal["pending", "paid"]


class BillSchema(BaseModel):
    bill_id: str
    session_id: str
    table_id: str
    order_ids: List[str] = Field(default_factory=list)
    items_subtotal: float = 0.0
    discount_amount: float = 0.0
    gst_rate: float = 5.0
    gst_amount: float = 0.0
    reservation_credit_applied: float = 0.0
    total_payable: float = 0.0
    payment_mode: Optional[PaymentMode] = None
    payment_status: PaymentStatus = "pending"
    requested_at: int  # Epoch ms
    settled_at: Optional[int] = None
    settled_by_staff_id: Optional[str] = None


class BillCreateSchema(BaseModel):
    session_id: str
    table_id: str
    order_ids: Optional[List[str]] = None
    discount_amount: Optional[float] = 0.0


class BillSettleSchema(BaseModel):
    payment_mode: PaymentMode
    settled_by_staff_id: Optional[str] = None
