from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.session import SessionModel
from models.table import TableModel
from schemas.session import SessionSchema, CheckInRequestSchema, SessionUpdateSchema
from mappers import to_session_schema
from services.session_service import handle_checkin
from dependencies import epoch_ms_to_dt
from websocket import manager

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=List[SessionSchema])
async def list_sessions(
    restaurant_id: str = "rst_default",
    table_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SessionModel).where(SessionModel.restaurant_id == restaurant_id)
    if table_id:
        stmt = stmt.where(SessionModel.table_id == table_id)
    if status:
        stmt = stmt.where(SessionModel.status == status)
    stmt = stmt.order_by(SessionModel.checkin_at.desc())

    res = await db.execute(stmt)
    sessions = res.scalars().all()
    return [to_session_schema(s) for s in sessions]


@router.get("/{session_id}", response_model=SessionSchema)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(SessionModel).where(SessionModel.session_id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return to_session_schema(session)


@router.post("/checkin", response_model=SessionSchema)
async def checkin(payload: CheckInRequestSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    try:
        extra_guests = [g.model_dump() for g in payload.guests] if payload.guests else None
        session = await handle_checkin(
            db=db,
            table_id=payload.table_id,
            phone=payload.phone,
            name=payload.name,
            email=payload.email,
            restaurant_id=restaurant_id,
            reservation_id=payload.reservation_id,
            extra_guests=extra_guests,
        )
        return to_session_schema(session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{session_id}", response_model=SessionSchema)
async def update_session(session_id: str, payload: SessionUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(SessionModel).where(SessionModel.session_id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    now = datetime.now(timezone.utc)
    if payload.status is not None:
        session.status = payload.status
        if payload.status in ("closed", "expired") and not session.closed_at:
            session.closed_at = now

    if payload.close_reason is not None:
        session.close_reason = payload.close_reason
    if payload.closed_at is not None:
        session.closed_at = epoch_ms_to_dt(payload.closed_at)
    if payload.guests is not None:
        session.guests = [g.model_dump() for g in payload.guests]

    session.updated_at = now

    # If session is closed, free the table
    if session.status in ("closed", "expired"):
        tbl_stmt = select(TableModel).where(TableModel.table_id == session.table_id)
        tbl_res = await db.execute(tbl_stmt)
        table = tbl_res.scalar_one_or_none()
        if table and table.current_session_id == session_id:
            table.status = "vacant"
            table.current_session_id = None
            table.call_waiter_active = False
            table.call_waiter_reason = None
            table.call_waiter_time = None
            await manager.broadcast(session.restaurant_id, {"type": "table_updated", "table_id": table.table_id})

    await db.commit()
    await db.refresh(session)

    await manager.broadcast(session.restaurant_id, {"type": "session_updated", "session_id": session.session_id})
    return to_session_schema(session)
