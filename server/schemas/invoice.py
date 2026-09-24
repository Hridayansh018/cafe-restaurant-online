from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from schemas.restaurant import AddressSchema
from schemas.bill import PaymentMode

DeliveryStatus = Literal["pending", "sent", "failed"]


class InvoiceLineItemSchema(BaseModel):
    name: str
    price: float
    quantity: int
    amount: float


class InvoiceSchema(BaseModel):
    invoice_id: str
    bill_id: str
    invoice_number: str
    gstin: str = ""
    restaurant_name: str
    restaurant_address: AddressSchema = Field(default_factory=AddressSchema)
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    items: List[InvoiceLineItemSchema] = Field(default_factory=list)
    items_subtotal: float
    discount_amount: float = 0.0
    gst_rate: float = 5.0
    gst_amount: float = 0.0
    reservation_credit: float = 0.0
    total_paid: float
    payment_mode: PaymentMode
    issued_at: int  # Epoch ms
    whatsapp_status: DeliveryStatus = "pending"
    email_status: DeliveryStatus = "pending"


class InvoiceResendSchema(BaseModel):
    channel: Literal["whatsapp", "email", "both"] = "both"
