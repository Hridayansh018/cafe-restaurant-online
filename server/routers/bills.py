from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.bill import BillModel
from models.order import OrderModel
from models.session import SessionModel
from models.reservation import ReservationModel
from models.table import TableModel
from schemas.bill import BillSchema, BillCreateSchema, BillSettleSchema
from schemas.invoice import InvoiceSchema
from mappers import to_bill_schema, to_invoice_schema
from services.bill_service import calculate_bill_totals, settle_bill
from websocket import manager

router = APIRouter(prefix="/bills", tags=["bills"])


@router.get("", response_model=List[BillSchema])
async def list_bills(
    restaurant_id: str = "rst_default",
    session_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(BillModel).where(BillModel.restaurant_id == restaurant_id)
    if session_id:
        stmt = stmt.where(BillModel.session_id == session_id)
    if status:
        stmt = stmt.where(BillModel.payment_status == status)
    stmt = stmt.order_by(BillModel.requested_at.desc())

    res = await db.execute(stmt)
    bills = res.scalars().all()
    return [to_bill_schema(b) for b in bills]


@router.get("/{bill_id}", response_model=BillSchema)
async def get_bill(bill_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(BillModel).where(BillModel.bill_id == bill_id)
    res = await db.execute(stmt)
    bill = res.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found")
    return to_bill_schema(bill)


@router.post("", response_model=BillSchema)
async def create_bill(payload: BillCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # 1. Fetch Session
    session_stmt = select(SessionModel).where(SessionModel.session_id == payload.session_id)
    session_res = await db.execute(session_stmt)
    session = session_res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {payload.session_id} not found")

    # 2. Find orders for this session
    orders_stmt = select(OrderModel).where(
        OrderModel.session_id == payload.session_id,
        OrderModel.status != "cancelled",
    )
    orders_res = await db.execute(orders_stmt)
    orders = orders_res.scalars().all()

    order_ids = payload.order_ids or [o.order_id for o in orders]
    items_subtotal = sum(float(o.subtotal) for o in orders if o.order_id in order_ids)

    # 3. Check reservation deposit credit
    reservation_credit = 0.0
    if session.reservation_id:
        res_stmt = select(ReservationModel).where(ReservationModel.reservation_id == session.reservation_id)
        res_res = await db.execute(res_stmt)
        reservation = res_res.scalar_one_or_none()
        if reservation and reservation.deposit_status == "paid":
            reservation_credit = float(reservation.deposit_amount or 0.0)

    discount_amount = payload.discount_amount or 0.0
    gst_rate = 5.0
    gst_amount, total_payable = calculate_bill_totals(
        items_subtotal=items_subtotal,
        discount_amount=discount_amount,
        gst_rate=gst_rate,
        reservation_credit=reservation_credit,
    )

    bill = BillModel(
        session_id=payload.session_id,
        restaurant_id=restaurant_id,
        table_id=payload.table_id,
        order_ids=order_ids,
        items_subtotal=items_subtotal,
        discount_amount=discount_amount,
        gst_rate=gst_rate,
        gst_amount=gst_amount,
        reservation_credit_applied=reservation_credit,
        total_payable=total_payable,
        payment_status="pending",
        requested_at=now,
    )
    db.add(bill)

    # Update Table status to billing_requested
    table_stmt = select(TableModel).where(TableModel.table_id == payload.table_id)
    table_res = await db.execute(table_stmt)
    table = table_res.scalar_one_or_none()
    if table:
        table.status = "billing_requested"
        table.updated_at = now

    await db.commit()
    await db.refresh(bill)

    await manager.broadcast(restaurant_id, {"type": "bill_updated", "bill_id": bill.bill_id})
    await manager.broadcast(restaurant_id, {"type": "table_updated", "table_id": payload.table_id})

    return to_bill_schema(bill)


@router.post("/{bill_id}/settle")
async def settle_bill_endpoint(bill_id: str, payload: BillSettleSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(BillModel).where(BillModel.bill_id == bill_id)
    res = await db.execute(stmt)
    bill = res.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found")

    invoice = await settle_bill(
        db=db,
        bill=bill,
        payment_mode=payload.payment_mode,
        settled_by_staff_id=payload.settled_by_staff_id,
    )

    return {
        "bill": to_bill_schema(bill),
        "invoice": to_invoice_schema(invoice),
    }
