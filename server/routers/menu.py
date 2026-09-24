from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.menu_item import MenuItemModel
from schemas.menu_item import MenuItemSchema, MenuItemCreateSchema, MenuItemUpdateSchema
from mappers import to_menu_item_schema

router = APIRouter(prefix="/menu-items", tags=["menu"])


@router.get("", response_model=List[MenuItemSchema])
async def list_menu_items(
    restaurant_id: str = "rst_default",
    category_id: Optional[str] = None,
    available_only: Optional[bool] = False,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MenuItemModel).where(MenuItemModel.restaurant_id == restaurant_id)
    if category_id:
        stmt = stmt.where(MenuItemModel.category_id == category_id)
    if available_only:
        stmt = stmt.where(MenuItemModel.is_available == True)
    stmt = stmt.order_by(MenuItemModel.sort_order)

    res = await db.execute(stmt)
    items = res.scalars().all()
    return [to_menu_item_schema(i) for i in items]


@router.get("/{item_id}", response_model=MenuItemSchema)
async def get_menu_item(item_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(MenuItemModel).where(MenuItemModel.item_id == item_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"Menu item {item_id} not found")
    return to_menu_item_schema(item)


@router.post("", response_model=MenuItemSchema)
async def create_menu_item(payload: MenuItemCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    modifiers_dicts = [m.model_dump() for m in payload.modifiers]
    item = MenuItemModel(
        restaurant_id=restaurant_id,
        category_id=payload.category_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        currency=payload.currency,
        image_url=payload.image_url,
        diet_tag=payload.diet_tag,
        spice_level=payload.spice_level,
        modifiers=modifiers_dicts,
        is_available=payload.is_available,
        qty_available=payload.qty_available,
        sort_order=payload.sort_order,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return to_menu_item_schema(item)


@router.put("/{item_id}", response_model=MenuItemSchema)
async def update_menu_item(item_id: str, payload: MenuItemUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(MenuItemModel).where(MenuItemModel.item_id == item_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"Menu item {item_id} not found")

    if payload.category_id is not None:
        item.category_id = payload.category_id
    if payload.name is not None:
        item.name = payload.name
    if payload.description is not None:
        item.description = payload.description
    if payload.price is not None:
        item.price = payload.price
    if payload.currency is not None:
        item.currency = payload.currency
    if payload.image_url is not None:
        item.image_url = payload.image_url
    if payload.diet_tag is not None:
        item.diet_tag = payload.diet_tag
    if payload.spice_level is not None:
        item.spice_level = payload.spice_level
    if payload.modifiers is not None:
        item.modifiers = [m.model_dump() for m in payload.modifiers]
    if payload.is_available is not None:
        item.is_available = payload.is_available
    if payload.qty_available is not None:
        item.qty_available = payload.qty_available
    if payload.sort_order is not None:
        item.sort_order = payload.sort_order

    item.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(item)
    return to_menu_item_schema(item)


@router.delete("/{item_id}")
async def delete_menu_item(item_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(MenuItemModel).where(MenuItemModel.item_id == item_id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"Menu item {item_id} not found")

    await db.delete(item)
    await db.commit()
    return {"success": True, "item_id": item_id}
