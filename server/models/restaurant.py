from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RestaurantModel(Base):
    __tablename__ = "restaurants"

    restaurant_id: Mapped[str] = mapped_column(String, primary_key=True, default="rst_default")
    name: Mapped[str] = mapped_column(String, nullable=False, default="My Restaurant")
    gstin: Mapped[str] = mapped_column(String, default="")
    address_line1: Mapped[str] = mapped_column(String, default="")
    address_city: Mapped[str] = mapped_column(String, default="")
    address_state: Mapped[str] = mapped_column(String, default="")
    address_pincode: Mapped[str] = mapped_column(String, default="")
    timezone: Mapped[str] = mapped_column(String, default="Asia/Kolkata")
    currency: Mapped[str] = mapped_column(String, default="INR")
    sla_prep_minutes: Mapped[int] = mapped_column(Integer, default=15)
    reservation_deposit_default: Mapped[int] = mapped_column(Integer, default=500)
    no_show_hours_before: Mapped[int] = mapped_column(Integer, default=2)
    no_show_forfeit_percent: Mapped[int] = mapped_column(Integer, default=100)
    brand_primary_color: Mapped[str] = mapped_column(String, default="#FF7A1A")
    brand_bg_color: Mapped[str] = mapped_column(String, default="#FFFFFF")
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
