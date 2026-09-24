from typing import Optional, Literal
from pydantic import BaseModel

ReservationStatus = Literal["confirmed", "checked_in", "cancelled", "no_show", "completed"]
DepositStatus = Literal["paid", "refunded", "forfeited"]


class ReservationSchema(BaseModel):
    reservation_id: str
    customer_phone: str
    customer_name: str
    party_size: int = 2
    reserved_for_date: str  # YYYY-MM-DD
    time_slot: str = "20:00"
    table_preference: str = ""
    deposit_amount: float = 0.0
    deposit_payment_id: str = ""
    deposit_status: DepositStatus = "paid"
    status: ReservationStatus = "confirmed"
    reminder_sent_at: Optional[int] = None  # Epoch ms
    notes: str = ""
    created_at: int  # Epoch ms


class ReservationCreateSchema(BaseModel):
    customer_phone: str
    customer_name: str
    party_size: int = 2
    reserved_for_date: str
    time_slot: str = "20:00"
    table_preference: Optional[str] = ""
    deposit_amount: float = 0.0
    deposit_payment_id: str = ""
    deposit_status: DepositStatus = "paid"
    status: ReservationStatus = "confirmed"
    notes: str = ""


class ReservationUpdateSchema(BaseModel):
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    party_size: Optional[int] = None
    reserved_for_date: Optional[str] = None
    time_slot: Optional[str] = None
    table_preference: Optional[str] = None
    deposit_amount: Optional[float] = None
    deposit_payment_id: Optional[str] = None
    deposit_status: Optional[DepositStatus] = None
    status: Optional[ReservationStatus] = None
    reminder_sent_at: Optional[int] = None
    notes: Optional[str] = None
