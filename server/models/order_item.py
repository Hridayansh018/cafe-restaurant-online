import uuid
from datetime import datetime, timezone
from typing import Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

if TYPE_CHECKING:
    from models.order import OrderModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class OrderItemModel(Base):
    __tablename__ = "order_items"

    order_item_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"oit_{uuid.uuid4().hex[:8]}")
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False)
    item_id: Mapped[str] = mapped_column(String, ForeignKey("menu_items.item_id", ondelete="RESTRICT"), nullable=False)
    name_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    price_snapshot: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    modifiers_selected: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    special_instructions: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="placed")  # placed, preparing, ready, served
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    order: Mapped["OrderModel"] = relationship("OrderModel", back_populates="items")
