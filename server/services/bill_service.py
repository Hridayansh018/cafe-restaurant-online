import uuid
from datetime import datetime, timezone
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.bill import BillModel
from models.invoice import InvoiceModel
from models.session import SessionModel
from models.table import TableModel
from models.restaurant import RestaurantModel
from models.customer import CustomerModel
from models.order import OrderModel
from websocket import manager


def calculate_bill_totals(
    items_subtotal: float,
    discount_amount: float = 0.0,
    gst_rate: float = 5.0,
    reservation_credit: float = 0.0,
) -> Tuple[float, float]:
    """Returns (gst_amount, total_payable)."""
    taxable = max(0.0, items_subtotal - discount_amount)
    gst_amount = round(taxable * (gst_rate / 100.0), 2)
    total_payable = max(0.0, round(taxable + gst_amount - reservation_credit, 2))
    return gst_amount, total_payable


async def settle_bill(
    db: AsyncSession,
    bill: BillModel,
    payment_mode: str,
    settled_by_staff_id: Optional[str] = None,
) -> InvoiceModel:
    """Settles a bill, marks session closed, frees table, creates invoice, updates customer stats, and broadcasts events."""
    now = datetime.now(timezone.utc)
    bill.payment_status = "paid"
    bill.payment_mode = payment_mode
    bill.settled_at = now
    bill.settled_by_staff_id = settled_by_staff_id

    # 1. Fetch Session
    session_stmt = select(SessionModel).where(SessionModel.session_id == bill.session_id)
    session_res = await db.execute(session_stmt)
    session = session_res.scalar_one_or_none()

    customer_phone = ""
    customer_name = "Guest"
    customer_email = ""

    if session:
        session.status = "closed"
        session.closed_at = now
        session.close_reason = "settled"
        if session.guests and len(session.guests) > 0:
            first_guest = session.guests[0]
            customer_phone = first_guest.get("phone", "")
            customer_name = first_guest.get("name", "Guest")

    # 2. Fetch Table and reset
    table_stmt = select(TableModel).where(TableModel.table_id == bill.table_id)
    table_res = await db.execute(table_stmt)
    table = table_res.scalar_one_or_none()
    if table:
        table.status = "vacant"
        table.current_session_id = None
        table.call_waiter_active = False
        table.call_waiter_reason = None
        table.call_waiter_time = None

    # 3. Fetch Restaurant details for invoice
    rst_stmt = select(RestaurantModel).where(RestaurantModel.restaurant_id == bill.restaurant_id)
    rst_res = await db.execute(rst_stmt)
    restaurant = rst_res.scalar_one_or_none()

    rst_name = restaurant.name if restaurant else "Spice Symphony"
    rst_gstin = restaurant.gstin if restaurant else ""
    rst_line1 = restaurant.address_line1 if restaurant else ""
    rst_city = restaurant.address_city if restaurant else ""
    rst_state = restaurant.address_state if restaurant else ""
    rst_pincode = restaurant.address_pincode if restaurant else ""

    # 4. Fetch orders and order items to snapshot on invoice
    invoice_items: List[Dict[str, Any]] = []
    if bill.order_ids:
        orders_stmt = select(OrderModel).where(OrderModel.order_id.in_(bill.order_ids))
        orders_res = await db.execute(orders_stmt)
        orders = orders_res.scalars().all()
        for ord in orders:
            for itm in ord.items:
                invoice_items.append({
                    "name": itm.name_snapshot,
                    "price": float(itm.price_snapshot),
                    "quantity": itm.quantity,
                    "amount": round(float(itm.price_snapshot) * itm.quantity, 2),
                })

    # If no items from orders, fallback
    if not invoice_items and bill.items_subtotal > 0:
        invoice_items.append({
            "name": "Dining Order",
            "price": float(bill.items_subtotal),
            "quantity": 1,
            "amount": float(bill.items_subtotal),
        })

    # 5. Generate Invoice
    inv_number = f"INV-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    invoice = InvoiceModel(
        bill_id=bill.bill_id,
        restaurant_id=bill.restaurant_id,
        invoice_number=inv_number,
        gstin=rst_gstin,
        restaurant_name=rst_name,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        items=invoice_items,
        items_subtotal=bill.items_subtotal,
        discount_amount=bill.discount_amount,
        gst_rate=bill.gst_rate,
        gst_amount=bill.gst_amount,
        reservation_credit=bill.reservation_credit_applied,
        total_paid=bill.total_payable,
        payment_mode=payment_mode,
        issued_at=now,
        whatsapp_status="sent",
        email_status="pending",
    )
    db.add(invoice)

    # 6. Update Customer stats if phone known
    if customer_phone:
        cust_stmt = select(CustomerModel).where(
            CustomerModel.restaurant_id == bill.restaurant_id,
            CustomerModel.phone == customer_phone,
        )
        cust_res = await db.execute(cust_stmt)
        customer = cust_res.scalar_one_or_none()
        if customer:
            customer.total_spent = float(customer.total_spent or 0) + float(bill.total_payable)
            customer.last_visit = now

    await db.commit()
    await db.refresh(bill)
    await db.refresh(invoice)

    # 7. Realtime Broadcast
    await manager.broadcast(bill.restaurant_id, {"type": "bill_updated", "bill_id": bill.bill_id})
    await manager.broadcast(bill.restaurant_id, {"type": "table_updated", "table_id": bill.table_id})
    await manager.broadcast(bill.restaurant_id, {"type": "session_updated", "session_id": bill.session_id})

    return invoice
