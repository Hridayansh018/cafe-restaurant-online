import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.table import TableModel
from schemas.table import TableSchema, TableCreateSchema, TableUpdateSchema
from mappers import to_table_schema
from dependencies import epoch_ms_to_dt
from websocket import manager

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("", response_model=List[TableSchema])
async def list_tables(restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    stmt = select(TableModel).where(TableModel.restaurant_id == restaurant_id).order_by(TableModel.label)
    res = await db.execute(stmt)
    tables = res.scalars().all()
    return [to_table_schema(t) for t in tables]


@router.get("/{table_id}", response_model=TableSchema)
async def get_table(table_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TableModel).where(TableModel.table_id == table_id)
    res = await db.execute(stmt)
    tbl = res.scalar_one_or_none()
    if not tbl:
        raise HTTPException(status_code=404, detail=f"Table {table_id} not found")
    return to_table_schema(tbl)


@router.post("", response_model=TableSchema)
async def create_table(payload: TableCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    token = str(uuid.uuid4())
    pos_x = payload.position.x if payload.position else 100
    pos_y = payload.position.y if payload.position else 100

    tbl = TableModel(
        restaurant_id=restaurant_id,
        label=payload.label,
        capacity=payload.capacity,
        zone=payload.zone,
        qr_token=token,
        qr_issued_at=now,
        qr_version=1,
        status=payload.status,
        pos_x=pos_x,
        pos_y=pos_y,
    )
    db.add(tbl)
    await db.commit()
    await db.refresh(tbl)

    await manager.broadcast(restaurant_id, {"type": "table_updated", "table_id": tbl.table_id})
    return to_table_schema(tbl)


@router.put("/{table_id}", response_model=TableSchema)
async def update_table(table_id: str, payload: TableUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(TableModel).where(TableModel.table_id == table_id)
    res = await db.execute(stmt)
    tbl = res.scalar_one_or_none()
    if not tbl:
        raise HTTPException(status_code=404, detail=f"Table {table_id} not found")

    now = datetime.now(timezone.utc)
    if payload.label is not None:
        tbl.label = payload.label
    if payload.capacity is not None:
        tbl.capacity = payload.capacity
    if payload.zone is not None:
        tbl.zone = payload.zone
    if payload.status is not None:
        tbl.status = payload.status
    if payload.current_session_id is not None:
        tbl.current_session_id = payload.current_session_id
    if payload.position is not None:
        tbl.pos_x = payload.position.x
        tbl.pos_y = payload.position.y
    if payload.pos_x is not None:
        tbl.pos_x = payload.pos_x
    if payload.pos_y is not None:
        tbl.pos_y = payload.pos_y
    if payload.call_waiter_active is not None:
        tbl.call_waiter_active = payload.call_waiter_active
    if payload.call_waiter_reason is not None:
        tbl.call_waiter_reason = payload.call_waiter_reason
    if payload.call_waiter_time is not None:
        tbl.call_waiter_time = epoch_ms_to_dt(payload.call_waiter_time)
    if payload.qr_token is not None:
        tbl.qr_token = payload.qr_token
    if payload.qr_issued_at is not None:
        tbl.qr_issued_at = epoch_ms_to_dt(payload.qr_issued_at)
    if payload.qr_version is not None:
        tbl.qr_version = payload.qr_version

    tbl.updated_at = now
    await db.commit()
    await db.refresh(tbl)

    await manager.broadcast(tbl.restaurant_id, {"type": "table_updated", "table_id": tbl.table_id})
    return to_table_schema(tbl)


@router.delete("/{table_id}")
async def delete_table(table_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TableModel).where(TableModel.table_id == table_id)
    res = await db.execute(stmt)
    tbl = res.scalar_one_or_none()
    if not tbl:
        raise HTTPException(status_code=404, detail=f"Table {table_id} not found")

    restaurant_id = tbl.restaurant_id
    await db.delete(tbl)
    await db.commit()

    await manager.broadcast(restaurant_id, {"type": "table_updated", "table_id": table_id})
    return {"success": True, "table_id": table_id}


@router.post("/{table_id}/reissue-qr")
async def reissue_table_qr(table_id: str, version: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(TableModel).where(TableModel.table_id == table_id)
    res = await db.execute(stmt)
    tbl = res.scalar_one_or_none()
    if not tbl:
        raise HTTPException(status_code=404, detail=f"Table {table_id} not found")

    now = datetime.now(timezone.utc)
    token = str(uuid.uuid4())
    tbl.qr_token = token
    tbl.qr_issued_at = now
    tbl.qr_version = version if version is not None else (tbl.qr_version + 1)
    tbl.updated_at = now

    await db.commit()
    await db.refresh(tbl)

    await manager.broadcast(tbl.restaurant_id, {"type": "table_updated", "table_id": tbl.table_id})
    return {"token": token, "qr_version": tbl.qr_version, "table": to_table_schema(tbl)}
