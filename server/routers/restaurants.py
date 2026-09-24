from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.restaurant import RestaurantModel
from schemas.restaurant import RestaurantSchema, RestaurantUpdateSchema
from mappers import to_restaurant_schema

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=RestaurantSchema)
async def get_restaurant(restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    stmt = select(RestaurantModel).where(RestaurantModel.restaurant_id == restaurant_id)
    res = await db.execute(stmt)
    rst = res.scalar_one_or_none()
    if not rst:
        # Fallback to any restaurant or create default
        stmt_any = select(RestaurantModel)
        res_any = await db.execute(stmt_any)
        rst = res_any.scalar_one_or_none()

    if not rst:
        rst = RestaurantModel(restaurant_id=restaurant_id, name="Spice Symphony")
        db.add(rst)
        await db.commit()
        await db.refresh(rst)

    return to_restaurant_schema(rst)


@router.put("", response_model=RestaurantSchema)
async def upsert_restaurant(payload: RestaurantUpdateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    stmt = select(RestaurantModel).where(RestaurantModel.restaurant_id == restaurant_id)
    res = await db.execute(stmt)
    rst = res.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if not rst:
        rst = RestaurantModel(restaurant_id=restaurant_id)
        db.add(rst)

    if payload.name is not None:
        rst.name = payload.name
    if payload.gstin is not None:
        rst.gstin = payload.gstin
    if payload.address is not None:
        rst.address_line1 = payload.address.line1
        rst.address_city = payload.address.city
        rst.address_state = payload.address.state
        rst.address_pincode = payload.address.pincode
    if payload.timezone is not None:
        rst.timezone = payload.timezone
    if payload.currency is not None:
        rst.currency = payload.currency
    if payload.sla_prep_minutes is not None:
        rst.sla_prep_minutes = payload.sla_prep_minutes
    if payload.reservation_deposit_default is not None:
        rst.reservation_deposit_default = payload.reservation_deposit_default
    if payload.no_show_forfeit_policy is not None:
        rst.no_show_hours_before = payload.no_show_forfeit_policy.hours_before
        rst.no_show_forfeit_percent = payload.no_show_forfeit_policy.forfeit_percent
    if payload.brand_theme is not None:
        rst.brand_primary_color = payload.brand_theme.primary_color
        rst.brand_bg_color = payload.brand_theme.background_color
    if payload.status is not None:
        rst.status = payload.status

    rst.updated_at = now
    await db.commit()
    await db.refresh(rst)

    return to_restaurant_schema(rst)
