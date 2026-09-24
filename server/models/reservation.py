import uuid
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Integer, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReservationModel(Base):
    __tablename__ = "reservations"

    reservation_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"res_{uuid.uuid4().hex[:8]}")
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    customer_phone: Mapped[str] = mapped_column(String, nullable=False)
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, default=2)
    reserved_for_date: Mapped[date] = mapped_column(Date, nullable=False)
    time_slot: Mapped[str] = mapped_column(String, default="20:00")
    table_preference: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    deposit_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    deposit_payment_id: Mapped[str] = mapped_column(String, default="")
    deposit_status: Mapped[str] = mapped_column(String, default="paid")  # paid, refunded, forfeited
    status: Mapped[str] = mapped_column(String, default="confirmed")  # confirmed, checked_in, cancelled, no_show, completed
    reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
