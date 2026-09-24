from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.reservation import ReservationModel
from schemas.reservation import ReservationSchema, ReservationCreateSchema, ReservationUpdateSchema
from mappers import to_reservation_schema
from dependencies import epoch_ms_to_dt

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.get("", response_model=List[ReservationSchema])
async def list_reservations(
    restaurant_id: str = "rst_default",
    reserved_for_date: Optional[str] = None,
    phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ReservationModel).where(ReservationModel.restaurant_id == restaurant_id)
    if reserved_for_date:
        d = date.fromisoformat(reserved_for_date)
        stmt = stmt.where(ReservationModel.reserved_for_date == d)
    if phone:
        stmt = stmt.where(ReservationModel.customer_phone == phone)
    stmt = stmt.order_by(ReservationModel.reserved_for_date.desc(), ReservationModel.time_slot.asc())

    res = await db.execute(stmt)
    reservations = res.scalars().all()
    return [to_reservation_schema(r) for r in reservations]


@router.get("/{reservation_id}", response_model=ReservationSchema)
async def get_reservation(reservation_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ReservationModel).where(ReservationModel.reservation_id == reservation_id)
    res = await db.execute(stmt)
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail=f"Reservation {reservation_id} not found")
    return to_reservation_schema(r)


@router.post("", response_model=ReservationSchema)
async def create_reservation(payload: ReservationCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    d = date.fromisoformat(payload.reserved_for_date)
    r = ReservationModel(
        restaurant_id=restaurant_id,
        customer_phone=payload.customer_phone,
        customer_name=payload.customer_name,
        party_size=payload.party_size,
        reserved_for_date=d,
        time_slot=payload.time_slot,
        table_preference=payload.table_preference,
        deposit_amount=payload.deposit_amount,
        deposit_payment_id=payload.deposit_payment_id,
        deposit_status=payload.deposit_status,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return to_reservation_schema(r)


@router.put("/{reservation_id}", response_model=ReservationSchema)
async def update_reservation(reservation_id: str, payload: ReservationUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(ReservationModel).where(ReservationModel.reservation_id == reservation_id)
    res = await db.execute(stmt)
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail=f"Reservation {reservation_id} not found")

    if payload.customer_phone is not None:
        r.customer_phone = payload.customer_phone
    if payload.customer_name is not None:
        r.customer_name = payload.customer_name
    if payload.party_size is not None:
        r.party_size = payload.party_size
    if payload.reserved_for_date is not None:
        r.reserved_for_date = date.fromisoformat(payload.reserved_for_date)
    if payload.time_slot is not None:
        r.time_slot = payload.time_slot
    if payload.table_preference is not None:
        r.table_preference = payload.table_preference
    if payload.deposit_amount is not None:
        r.deposit_amount = payload.deposit_amount
    if payload.deposit_payment_id is not None:
        r.deposit_payment_id = payload.deposit_payment_id
    if payload.deposit_status is not None:
        r.deposit_status = payload.deposit_status
    if payload.status is not None:
        r.status = payload.status
    if payload.reminder_sent_at is not None:
        r.reminder_sent_at = epoch_ms_to_dt(payload.reminder_sent_at)
    if payload.notes is not None:
        r.notes = payload.notes

    r.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(r)
    return to_reservation_schema(r)


@router.delete("/{reservation_id}")
async def delete_reservation(reservation_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ReservationModel).where(ReservationModel.reservation_id == reservation_id)
    res = await db.execute(stmt)
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail=f"Reservation {reservation_id} not found")

    await db.delete(r)
    await db.commit()
    return {"success": True, "reservation_id": reservation_id}
