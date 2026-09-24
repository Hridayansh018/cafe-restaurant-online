from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.category import CategoryModel
from schemas.category import CategorySchema, CategoryCreateSchema, CategoryUpdateSchema
from mappers import to_category_schema

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategorySchema])
async def list_categories(restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    stmt = select(CategoryModel).where(CategoryModel.restaurant_id == restaurant_id).order_by(CategoryModel.sort_order)
    res = await db.execute(stmt)
    cats = res.scalars().all()
    return [to_category_schema(c) for c in cats]


@router.post("", response_model=CategorySchema)
async def create_category(payload: CategoryCreateSchema, restaurant_id: str = "rst_default", db: AsyncSession = Depends(get_db)):
    cat = CategoryModel(
        restaurant_id=restaurant_id,
        name=payload.name,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return to_category_schema(cat)


@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(category_id: str, payload: CategoryUpdateSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(CategoryModel).where(CategoryModel.category_id == category_id)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category {category_id} not found")

    if payload.name is not None:
        cat.name = payload.name
    if payload.sort_order is not None:
        cat.sort_order = payload.sort_order
    if payload.is_active is not None:
        cat.is_active = payload.is_active

    cat.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(cat)
    return to_category_schema(cat)


@router.delete("/{category_id}")
async def delete_category(category_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CategoryModel).where(CategoryModel.category_id == category_id)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category {category_id} not found")

    await db.delete(cat)
    await db.commit()
    return {"success": True, "category_id": category_id}
