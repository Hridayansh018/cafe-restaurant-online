from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.invoice import InvoiceModel
from schemas.invoice import InvoiceSchema, InvoiceResendSchema
from mappers import to_invoice_schema

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.get("", response_model=List[InvoiceSchema])
async def list_invoices(
    restaurant_id: str = "rst_default",
    customer_phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(InvoiceModel).where(InvoiceModel.restaurant_id == restaurant_id)
    if customer_phone:
        stmt = stmt.where(InvoiceModel.customer_phone == customer_phone)
    stmt = stmt.order_by(InvoiceModel.issued_at.desc())

    res = await db.execute(stmt)
    invoices = res.scalars().all()
    return [to_invoice_schema(inv) for inv in invoices]


@router.get("/{invoice_id}", response_model=InvoiceSchema)
async def get_invoice(invoice_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(InvoiceModel).where(InvoiceModel.invoice_id == invoice_id)
    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    return to_invoice_schema(invoice)


@router.post("/{invoice_id}/resend", response_model=InvoiceSchema)
async def resend_invoice(invoice_id: str, payload: InvoiceResendSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(InvoiceModel).where(InvoiceModel.invoice_id == invoice_id)
    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")

    if payload.channel in ("whatsapp", "both"):
        invoice.whatsapp_status = "sent"
    if payload.channel in ("email", "both"):
        invoice.email_status = "sent"

    await db.commit()
    await db.refresh(invoice)
    return to_invoice_schema(invoice)
