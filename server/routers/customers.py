from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.customer import CustomerModel
from schemas.customer import CustomerSchema, CustomerCreateSchema, CustomerUpdateSchema
from mappers import to_customer_schema
from dependencies import epoch_ms_to_dt

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=List[CustomerSchema])
async def list_customers(
    restaurant_id: str = "rst_default",
    phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CustomerModel).where(CustomerModel.restaurant_id == restaurant_id)
    if phone:
        stmt = stmt.where(CustomerModel.phone.like(f"%{phone}%"))
    stmt = stmt.order_by(CustomerModel.created_at.desc())

    res = await db.execute(stmt)
    customers = res.scalars().all()
    return [to_customer_schema(c) for c in customers]


@router.get("/{customer_id}", response_model=CustomerSchema)
async def get_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CustomerModel).where(CustomerModel.customer_id == customer_id)
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
    return to_customer_schema(c)


@router.post("", response_model=CustomerSchema)
async def create_customer(payload: CustomerCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    # Check if exists by phone
    stmt = select(CustomerModel).where(
        CustomerModel.restaurant_id == restaurant_id,
        CustomerModel.phone == payload.phone,
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        if payload.name:
            existing.name = payload.name
        if payload.email:
            existing.email = payload.email
        existing.marketing_opt_in = payload.marketing_opt_in
        existing.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return to_customer_schema(existing)

    now = datetime.now(timezone.utc)
    c = CustomerModel(
        restaurant_id=restaurant_id,
        phone=payload.phone,
        name=payload.name,
        email=payload.email,
        marketing_opt_in=payload.marketing_opt_in,
        visit_count=1,
        total_spent=0.0,
        last_visit=now,
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return to_customer_schema(c)


@router.put("/{customer_id}", response_model=CustomerSchema)
async def update_customer(customer_id: str, payload: CustomerUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(CustomerModel).where(CustomerModel.customer_id == customer_id)
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    if payload.phone is not None:
        c.phone = payload.phone
    if payload.name is not None:
        c.name = payload.name
    if payload.email is not None:
        c.email = payload.email
    if payload.marketing_opt_in is not None:
        c.marketing_opt_in = payload.marketing_opt_in
    if payload.visit_count is not None:
        c.visit_count = payload.visit_count
    if payload.total_spent is not None:
        c.total_spent = payload.total_spent
    if payload.last_visit is not None:
        c.last_visit = epoch_ms_to_dt(payload.last_visit)

    c.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(c)
    return to_customer_schema(c)
