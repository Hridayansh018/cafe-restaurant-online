import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CampaignModel(Base):
    __tablename__ = "campaigns"

    campaign_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"cmp_{uuid.uuid4().hex[:8]}")
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    name: Mapped[str] = mapped_column(String, nullable=False)
    channel: Mapped[str] = mapped_column(String, default="both")  # whatsapp, email, both
    template_id: Mapped[str] = mapped_column(String, default="")
    message_body: Mapped[str] = mapped_column(String, default="")
    audience_last_visit_days: Mapped[int] = mapped_column(Integer, default=90)
    audience_min_orders: Mapped[int] = mapped_column(Integer, default=1)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    opened_count: Mapped[int] = mapped_column(Integer, default=0)
    redeemed_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="draft")  # draft, scheduled, sent
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
