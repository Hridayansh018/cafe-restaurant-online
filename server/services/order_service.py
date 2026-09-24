from datetime import datetime, timezone, timedelta
from typing import List
from models.order import OrderModel
from models.order_item import OrderItemModel


def calculate_sla_deadline(placed_at: datetime, prep_minutes: int = 15) -> datetime:
    return placed_at + timedelta(minutes=prep_minutes)


def check_sla_breach(order: OrderModel) -> bool:
    if order.status in ("served", "cancelled"):
        return False
    now = datetime.now(timezone.utc)
    sla_deadline = order.sla_deadline
    if sla_deadline.tzinfo is None:
        sla_deadline = sla_deadline.replace(tzinfo=timezone.utc)
    return now > sla_deadline


def calculate_subtotal(items: List[OrderItemModel]) -> float:
    return float(sum(float(item.price_snapshot) * int(item.quantity) for item in items))


def cascade_item_status_to_order(order: OrderModel) -> str:
    """Cascade individual item statuses up to the parent order."""
    if not order.items:
        return order.status

    statuses = [item.status for item in order.items]
    if all(s == "served" for s in statuses):
        return "served"
    elif all(s in ("ready", "served") for s in statuses):
        return "ready"
    elif any(s in ("preparing", "ready") for s in statuses):
        return "preparing"
    else:
        return "placed"
