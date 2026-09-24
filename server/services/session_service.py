from datetime import datetime, timezone, timedelta, date
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.session import SessionModel
from models.table import TableModel
from models.customer import CustomerModel
from models.reservation import ReservationModel
from websocket import manager


async def handle_checkin(
    db: AsyncSession,
    table_id: str,
    phone: str,
    name: str,
    email: Optional[str] = "",
    restaurant_id: str = "rst_default",
    reservation_id: Optional[str] = None,
    extra_guests: Optional[List[Dict[str, Any]]] = None,
) -> SessionModel:
    """Handles diner check-in: joins existing active session or creates a new one, updates table and customer."""
    now = datetime.now(timezone.utc)
    now_ms = int(now.timestamp() * 1000)

    # 1. Check Table
    table_stmt = select(TableModel).where(TableModel.table_id == table_id)
    table_res = await db.execute(table_stmt)
    table = table_res.scalar_one_or_none()
    if not table:
        raise ValueError(f"Table {table_id} not found")

    guest_entry = {
        "name": name,
        "phone": phone,
        "joined_at": now_ms,
    }

    # 2. Check for active session on this table
    session_stmt = select(SessionModel).where(
        SessionModel.table_id == table_id,
        SessionModel.status == "active",
    )
    session_res = await db.execute(session_stmt)
    session = session_res.scalar_one_or_none()

    if session:
        # Join existing session
        current_guests = list(session.guests or [])
        # Avoid duplicate guest if already joined
        if not any(g.get("phone") == phone for g in current_guests):
            current_guests.append(guest_entry)
        if extra_guests:
            for eg in extra_guests:
                if not any(g.get("phone") == eg.get("phone") for g in current_guests):
                    current_guests.append(eg)
        session.guests = current_guests
        session.updated_at = now
    else:
        # Create new session
        initial_guests = [guest_entry]
        if extra_guests:
            for eg in extra_guests:
                if not any(g.get("phone") == eg.get("phone") for g in initial_guests):
                    initial_guests.append(eg)

        # Match reservation if not provided
        matched_res_id = reservation_id
        if not matched_res_id:
            today_date = date.today()
            res_stmt = select(ReservationModel).where(
                ReservationModel.restaurant_id == restaurant_id,
                ReservationModel.customer_phone == phone,
                ReservationModel.reserved_for_date == today_date,
                ReservationModel.status == "confirmed",
            )
            res_res = await db.execute(res_stmt)
            matched_res = res_res.scalar_one_or_none()
            if matched_res:
                matched_res_id = matched_res.reservation_id
                matched_res.status = "checked_in"

        session = SessionModel(
            restaurant_id=restaurant_id,
            table_id=table_id,
            status="active",
            guests=initial_guests,
            reservation_id=matched_res_id,
            checkin_at=now,
            expires_at=now + timedelta(hours=3),
        )
        db.add(session)
        await db.flush()  # To populate session_id

    # 3. Update table
    table.status = "occupied"
    table.current_session_id = session.session_id
    table.updated_at = now

    # 4. Upsert customer
    cust_stmt = select(CustomerModel).where(
        CustomerModel.restaurant_id == restaurant_id,
        CustomerModel.phone == phone,
    )
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalar_one_or_none()
    if customer:
        customer.visit_count = (customer.visit_count or 0) + 1
        customer.last_visit = now
        if name:
            customer.name = name
        if email:
            customer.email = email
    else:
        customer = CustomerModel(
            restaurant_id=restaurant_id,
            phone=phone,
            name=name,
            email=email or "",
            marketing_opt_in=True,
            visit_count=1,
            total_spent=0.0,
            last_visit=now,
        )
        db.add(customer)

    await db.commit()
    await db.refresh(session)
    await db.refresh(table)

    # 5. Realtime Broadcast
    await manager.broadcast(restaurant_id, {"type": "table_updated", "table_id": table_id})
    await manager.broadcast(restaurant_id, {"type": "session_updated", "session_id": session.session_id})

    return session
