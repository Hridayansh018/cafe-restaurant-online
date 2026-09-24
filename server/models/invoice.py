import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy import String, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class InvoiceModel(Base):
    __tablename__ = "invoices"

    invoice_id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"inv_{uuid.uuid4().hex[:8]}")
    bill_id: Mapped[str] = mapped_column(String, ForeignKey("bills.bill_id", ondelete="CASCADE"), nullable=False)
    restaurant_id: Mapped[str] = mapped_column(String, ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), default="rst_default")
    invoice_number: Mapped[str] = mapped_column(String, nullable=False)
    gstin: Mapped[str] = mapped_column(String, default="")
    restaurant_name: Mapped[str] = mapped_column(String, nullable=False)
    restaurant_address_line1: Mapped[str] = mapped_column(String, default="")
    restaurant_address_city: Mapped[str] = mapped_column(String, default="")
    restaurant_address_state: Mapped[str] = mapped_column(String, default="")
    restaurant_address_pincode: Mapped[str] = mapped_column(String, default="")
    customer_name: Mapped[str] = mapped_column(String, default="")
    customer_phone: Mapped[str] = mapped_column(String, default="")
    customer_email: Mapped[str] = mapped_column(String, default="")
    items: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    items_subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    gst_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=5.0)
    gst_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    reservation_credit: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    total_paid: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    payment_mode: Mapped[str] = mapped_column(String, default="counter_cash")
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    whatsapp_status: Mapped[str] = mapped_column(String, default="pending")  # pending, sent, failed
    email_status: Mapped[str] = mapped_column(String, default="pending")  # pending, sent, failed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
