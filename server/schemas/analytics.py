from typing import List
from pydantic import BaseModel


class DailyRevenue(BaseModel):
    date: str
    revenue: float
    orders: int


class TopItem(BaseModel):
    item_id: str
    name: str
    count: int
    revenue: float


class RevenueStats(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    period_days: int
