from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.campaign import CampaignModel
from schemas.campaign import CampaignSchema, CampaignCreateSchema, CampaignUpdateSchema
from mappers import to_campaign_schema
from dependencies import epoch_ms_to_dt

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=List[CampaignSchema])
async def list_campaigns(restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    stmt = select(CampaignModel).where(CampaignModel.restaurant_id == restaurant_id).order_by(CampaignModel.created_at.desc())
    res = await db.execute(stmt)
    campaigns = res.scalars().all()
    return [to_campaign_schema(c) for c in campaigns]


@router.get("/{campaign_id}", response_model=CampaignSchema)
async def get_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CampaignModel).where(CampaignModel.campaign_id == campaign_id)
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return to_campaign_schema(c)


@router.post("", response_model=CampaignSchema)
async def create_campaign(payload: CampaignCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    c = CampaignModel(
        restaurant_id=restaurant_id,
        name=payload.name,
        channel=payload.channel,
        template_id=payload.template_id,
        message_body=payload.message_body,
        audience_last_visit_days=payload.audience_filter.last_visit_within_days,
        audience_min_orders=payload.audience_filter.min_orders,
        scheduled_at=epoch_ms_to_dt(payload.scheduled_at),
        status=payload.status,
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return to_campaign_schema(c)


@router.put("/{campaign_id}", response_model=CampaignSchema)
async def update_campaign(campaign_id: str, payload: CampaignUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(CampaignModel).where(CampaignModel.campaign_id == campaign_id)
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")

    if payload.name is not None:
        c.name = payload.name
    if payload.channel is not None:
        c.channel = payload.channel
    if payload.template_id is not None:
        c.template_id = payload.template_id
    if payload.message_body is not None:
        c.message_body = payload.message_body
    if payload.audience_filter is not None:
        c.audience_last_visit_days = payload.audience_filter.last_visit_within_days
        c.audience_min_orders = payload.audience_filter.min_orders
    if payload.scheduled_at is not None:
        c.scheduled_at = epoch_ms_to_dt(payload.scheduled_at)
    if payload.sent_count is not None:
        c.sent_count = payload.sent_count
    if payload.opened_count is not None:
        c.opened_count = payload.opened_count
    if payload.redeemed_count is not None:
        c.redeemed_count = payload.redeemed_count
    if payload.status is not None:
        c.status = payload.status

    c.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(c)
    return to_campaign_schema(c)


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CampaignModel).where(CampaignModel.campaign_id == campaign_id)
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")

    await db.delete(c)
    await db.commit()
    return {"success": True, "campaign_id": campaign_id}
