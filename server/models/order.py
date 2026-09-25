import uuid
from datetime import datetime, timezone, timedelta
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

if TYPE_CHECKING:
    from models.order_item import OrderItemModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def default_sla() -> datetime:
    return utc_now() + timedelta(minutes=15)


class OrderModel(Base):
    __tablename__ = "orders"

    order_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"ord_{uuid.uuid4().hex[:8]}")
    session_id: Mapped[str] = mapped_column(String, ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False)
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    table_id: Mapped[str] = mapped_column(String, ForeignKey("tables.table_id", ondelete="CASCADE"), nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, default=1)
    placed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    placed_by_name: Mapped[str] = mapped_column(String, default="")
    placed_by_phone: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="placed")  # placed, preparing, ready, served, cancelled
    sla_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_sla)
    sla_breached: Mapped[bool] = mapped_column(Boolean, default=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    items: Mapped[List["OrderItemModel"]] = relationship("OrderItemModel", back_populates="order", cascade="all, delete-orphan", lazy="selectin")
