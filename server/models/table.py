import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TableModel(Base):
    __tablename__ = "tables"

    table_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"tbl_{uuid.uuid4().hex[:8]}")
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    label: Mapped[str] = mapped_column(String, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=4)
    zone: Mapped[str] = mapped_column(String, default="Indoor")
    qr_token: Mapped[str] = mapped_column(String, default=lambda: str(uuid.uuid4()))
    qr_issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    qr_version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String, default="vacant")  # vacant, occupied, billing_requested, reserved
    current_session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pos_x: Mapped[int] = mapped_column(Integer, default=100)
    pos_y: Mapped[int] = mapped_column(Integer, default=100)
    call_waiter_active: Mapped[bool] = mapped_column(Boolean, default=False)
    call_waiter_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    call_waiter_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
