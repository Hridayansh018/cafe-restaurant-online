from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.staff import StaffModel
from schemas.staff import StaffSchema, StaffCreateSchema, StaffUpdateSchema
from mappers import to_staff_schema
from dependencies import hash_pin

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=List[StaffSchema])
async def list_staff(restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    stmt = select(StaffModel).where(StaffModel.restaurant_id == restaurant_id).order_by(StaffModel.name)
    res = await db.execute(stmt)
    staff_members = res.scalars().all()
    return [to_staff_schema(s) for s in staff_members]


@router.get("/{staff_id}", response_model=StaffSchema)
async def get_staff_member(staff_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(StaffModel).where(StaffModel.staff_id == staff_id)
    res = await db.execute(stmt)
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail=f"Staff member {staff_id} not found")
    return to_staff_schema(s)


@router.post("", response_model=StaffSchema)
async def create_staff(payload: StaffCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    pin_hash = hash_pin(payload.pin) if payload.pin else None
    staff = StaffModel(
        restaurant_id=restaurant_id,
        name=payload.name,
        role=payload.role,
        phone=payload.phone,
        pin_hash=pin_hash,
        is_active=payload.is_active,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return to_staff_schema(staff)


@router.put("/{staff_id}", response_model=StaffSchema)
async def update_staff(staff_id: str, payload: StaffUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(StaffModel).where(StaffModel.staff_id == staff_id)
    res = await db.execute(stmt)
    staff = res.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail=f"Staff member {staff_id} not found")

    if payload.name is not None:
        staff.name = payload.name
    if payload.role is not None:
        staff.role = payload.role
    if payload.phone is not None:
        staff.phone = payload.phone
    if payload.is_active is not None:
        staff.is_active = payload.is_active
    if payload.pin is not None:
        staff.pin_hash = hash_pin(payload.pin) if payload.pin else None

    staff.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(staff)
    return to_staff_schema(staff)


@router.delete("/{staff_id}")
async def delete_staff(staff_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(StaffModel).where(StaffModel.staff_id == staff_id)
    res = await db.execute(stmt)
    staff = res.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail=f"Staff member {staff_id} not found")

    await db.delete(staff)
    await db.commit()
    return {"success": True, "staff_id": staff_id}
