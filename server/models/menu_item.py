import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Boolean, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MenuItemModel(Base):
    __tablename__ = "menu_items"

    item_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"itm_{uuid.uuid4().hex[:8]}")
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    category_id: Mapped[str] = mapped_column(String, ForeignKey("categories.category_id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, default="")
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    currency: Mapped[str] = mapped_column(String, default="INR")
    image_url: Mapped[str] = mapped_column(String, default="")
    diet_tag: Mapped[str] = mapped_column(String, default="veg")
    spice_level: Mapped[str] = mapped_column(String, default="mild")
    modifiers: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    qty_available: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
