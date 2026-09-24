from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.order import OrderModel
from models.order_item import OrderItemModel
from models.restaurant import RestaurantModel
from schemas.order import (
    OrderSchema,
    OrderCreateSchema,
    OrderStatusUpdateSchema,
    OrderItemStatusUpdateSchema,
    OrderItemSchema,
)
from mappers import to_order_schema, to_order_item_schema
from services.order_service import calculate_sla_deadline, check_sla_breach, cascade_item_status_to_order
from websocket import manager

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=List[OrderSchema])
async def list_orders(
    restaurant_id: str = "rst_default",
    session_id: Optional[str] = None,
    status: Optional[str] = None,
    table_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(OrderModel).where(OrderModel.restaurant_id == restaurant_id)
    if session_id:
        stmt = stmt.where(OrderModel.session_id == session_id)
    if status:
        stmt = stmt.where(OrderModel.status == status)
    if table_id:
        stmt = stmt.where(OrderModel.table_id == table_id)
    stmt = stmt.order_by(OrderModel.placed_at.desc())

    res = await db.execute(stmt)
    orders = res.scalars().all()

    # Check SLA breach dynamically
    for o in orders:
        o.sla_breached = check_sla_breach(o)

    return [to_order_schema(o) for o in orders]


@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(OrderModel).where(OrderModel.order_id == order_id)
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    order.sla_breached = check_sla_breach(order)
    return to_order_schema(order)


@router.post("", response_model=OrderSchema)
async def create_order(payload: OrderCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Fetch restaurant SLA prep minutes
    rst_stmt = select(RestaurantModel).where(RestaurantModel.restaurant_id == restaurant_id)
    rst_res = await db.execute(rst_stmt)
    restaurant = rst_res.scalar_one_or_none()
    sla_minutes = restaurant.sla_prep_minutes if restaurant else 15

    sla_deadline = calculate_sla_deadline(now, sla_minutes)

    subtotal = sum(float(item.price_snapshot) * item.quantity for item in payload.items)

    order = OrderModel(
        session_id=payload.session_id,
        restaurant_id=restaurant_id,
        table_id=payload.table_id,
        round_number=payload.round_number,
        placed_at=now,
        placed_by_name=payload.placed_by.name,
        placed_by_phone=payload.placed_by.phone,
        status="placed",
        sla_deadline=sla_deadline,
        sla_breached=False,
        subtotal=round(subtotal, 2),
    )
    db.add(order)
    await db.flush()

    for item in payload.items:
        order_item = OrderItemModel(
            order_id=order.order_id,
            item_id=item.item_id,
            name_snapshot=item.name_snapshot,
            price_snapshot=item.price_snapshot,
            quantity=item.quantity,
            modifiers_selected=item.modifiers_selected,
            special_instructions=item.special_instructions,
            status="placed",
        )
        db.add(order_item)

    await db.commit()
    await db.refresh(order)

    await manager.broadcast(restaurant_id, {"type": "order_updated", "order_id": order.order_id})
    return to_order_schema(order)


@router.post("/{order_id}/status", response_model=OrderSchema)
async def update_order_status(order_id: str, payload: OrderStatusUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(OrderModel).where(OrderModel.order_id == order_id)
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order.status = payload.status
    order.updated_at = datetime.now(timezone.utc)
    order.sla_breached = check_sla_breach(order)

    # If order is updated, cascade status down to items
    if payload.status in ("preparing", "ready", "served"):
        for item in order.items:
            item.status = payload.status

    await db.commit()
    await db.refresh(order)

    await manager.broadcast(order.restaurant_id, {"type": "order_updated", "order_id": order.order_id})
    return to_order_schema(order)


@router.post("/items/{order_item_id}/status", response_model=OrderItemSchema)
async def update_order_item_status(order_item_id: str, payload: OrderItemStatusUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(OrderItemModel).where(OrderItemModel.order_item_id == order_item_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"Order item {order_item_id} not found")

    item.status = payload.status
    item.updated_at = datetime.now(timezone.utc)

    # Cascade to parent order
    order_stmt = select(OrderModel).where(OrderModel.order_id == item.order_id)
    order_res = await db.execute(order_stmt)
    order = order_res.scalar_one_or_none()
    if order:
        new_order_status = cascade_item_status_to_order(order)
        order.status = new_order_status
        order.updated_at = datetime.now(timezone.utc)
        order.sla_breached = check_sla_breach(order)

    await db.commit()
    await db.refresh(item)

    if order:
        await manager.broadcast(order.restaurant_id, {"type": "order_updated", "order_id": order.order_id})

    return to_order_item_schema(item)
