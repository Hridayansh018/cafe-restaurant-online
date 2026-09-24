import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def default_session_expiry() -> datetime:
    return utc_now() + timedelta(hours=3)


class SessionModel(Base):
    __tablename__ = "sessions"

    session_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"sess_{uuid.uuid4().hex[:8]}")
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    table_id: Mapped[str] = mapped_column(String, ForeignKey("tables.table_id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="active")  # active, closed, expired
    guests: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    reservation_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    checkin_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_session_expiry)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    close_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
