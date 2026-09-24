from datetime import datetime, timezone, timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.bill import BillModel
from models.order import OrderModel
from models.order_item import OrderItemModel
from schemas.analytics import DailyRevenue, TopItem, RevenueStats

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/daily-revenue", response_model=List[DailyRevenue])
async def get_daily_revenue(days: int = 7, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Query settled bills
    stmt = select(BillModel).where(
        BillModel.restaurant_id == restaurant_id,
        BillModel.payment_status == "paid",
        BillModel.settled_at >= start_date,
    )
    res = await db.execute(stmt)
    bills = res.scalars().all()

    # Aggregate by date YYYY-MM-DD
    revenue_map: Dict[str, Dict[str, float]] = {}
    for i in range(days):
        day_str = (start_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
        revenue_map[day_str] = {"revenue": 0.0, "orders": 0}

    for b in bills:
        if b.settled_at:
            day_str = b.settled_at.strftime("%Y-%m-%d")
            if day_str not in revenue_map:
                revenue_map[day_str] = {"revenue": 0.0, "orders": 0}
            revenue_map[day_str]["revenue"] += float(b.total_payable)
            revenue_map[day_str]["orders"] += len(b.order_ids or [])

    result = [
        DailyRevenue(date=k, revenue=round(v["revenue"], 2), orders=int(v["orders"]))
        for k, v in sorted(revenue_map.items())
    ]
    return result


@router.get("/top-items", response_model=List[TopItem])
async def get_top_items(limit: int = 5, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    # Query order items
    stmt = (
        select(OrderItemModel)
        .join(OrderModel, OrderModel.order_id == OrderItemModel.order_id)
        .where(
            OrderModel.restaurant_id == restaurant_id,
            OrderModel.status.in_(("ready", "served")),
        )
    )
    res = await db.execute(stmt)
    items = res.scalars().all()

    agg: Dict[str, Dict[str, Any]] = {}
    for itm in items:
        if itm.item_id not in agg:
            agg[itm.item_id] = {
                "item_id": itm.item_id,
                "name": itm.name_snapshot,
                "count": 0,
                "revenue": 0.0,
            }
        agg[itm.item_id]["count"] += itm.quantity
        agg[itm.item_id]["revenue"] += float(itm.price_snapshot) * itm.quantity

    sorted_items = sorted(agg.values(), key=lambda x: x["count"], reverse=True)[:limit]
    return [
        TopItem(
            item_id=i["item_id"],
            name=i["name"],
            count=i["count"],
            revenue=round(i["revenue"], 2),
        )
        for i in sorted_items
    ]


@router.get("/summary", response_model=RevenueStats)
async def get_summary(days: int = 30, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = select(BillModel).where(
        BillModel.restaurant_id == restaurant_id,
        BillModel.payment_status == "paid",
        BillModel.settled_at >= start_date,
    )
    res = await db.execute(stmt)
    bills = res.scalars().all()

    total_rev = sum(float(b.total_payable) for b in bills)
    total_ord = sum(len(b.order_ids or []) for b in bills)
    aov = round(total_rev / total_ord, 2) if total_ord > 0 else 0.0

    return RevenueStats(
        total_revenue=round(total_rev, 2),
        total_orders=total_ord,
        average_order_value=aov,
        period_days=days,
    )
