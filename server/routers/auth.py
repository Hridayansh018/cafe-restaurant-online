from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.staff import StaffModel
from schemas.auth import VerifyPinRequest, VerifyPinResponse
from dependencies import verify_admin_pin, verify_pin_hash

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify-pin", response_model=VerifyPinResponse)
async def verify_pin(req: VerifyPinRequest, db: AsyncSession = Depends(get_db)):
    pin = req.pin.strip()
    if not pin:
        raise HTTPException(status_code=400, detail="PIN cannot be empty")

    # 1. Check if Admin PIN matches settings
    if verify_admin_pin(pin):
        return VerifyPinResponse(
            success=True,
            role="admin",
            name="Administrator",
            message="Authenticated as Admin",
        )

    # 2. Check active staff members in DB
    stmt = select(StaffModel).where(StaffModel.is_active == True)
    result = await db.execute(stmt)
    staff_list = result.scalars().all()

    for s in staff_list:
        if s.pin_hash and verify_pin_hash(pin, s.pin_hash):
            return VerifyPinResponse(
                success=True,
                role=s.role,
                staff_id=s.staff_id,
                name=s.name,
                message=f"Authenticated as {s.name} ({s.role})",
            )

    return VerifyPinResponse(
        success=False,
        message="Invalid PIN",
    )
