import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class BillModel(Base):
    __tablename__ = "bills"

    bill_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"bil_{uuid.uuid4().hex[:8]}")
    session_id: Mapped[str] = mapped_column(String, ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False)
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    table_id: Mapped[str] = mapped_column(String, ForeignKey("tables.table_id", ondelete="CASCADE"), nullable=False)
    order_ids: Mapped[List[str]] = mapped_column(JSON, default=list)
    items_subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    gst_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=5.0)
    gst_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    reservation_credit_applied: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    total_payable: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    payment_mode: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # online_upi, online_card, counter_cash, counter_card
    payment_status: Mapped[str] = mapped_column(String, default="pending")  # pending, paid
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    settled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    settled_by_staff_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("staff.staff_id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
