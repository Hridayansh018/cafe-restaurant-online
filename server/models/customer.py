import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CustomerModel(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "phone", name="uq_customer_restaurant_phone"),
    )

    customer_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"cus_{uuid.uuid4().hex[:8]}")
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    phone: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, default="")
    email: Mapped[str] = mapped_column(String, default="")
    marketing_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)
    visit_count: Mapped[int] = mapped_column(Integer, default=0)
    total_spent: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    last_visit: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
