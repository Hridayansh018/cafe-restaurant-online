import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CategoryModel(Base):
    __tablename__ = "categories"

    category_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"cat_{uuid.uuid4().hex[:8]}")
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    name: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
