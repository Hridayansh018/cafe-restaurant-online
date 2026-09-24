from typing import Optional
from pydantic import BaseModel


class VerifyPinRequest(BaseModel):
    pin: str


class VerifyPinResponse(BaseModel):
    success: bool
    role: Optional[str] = None
    staff_id: Optional[str] = None
    name: Optional[str] = None
    message: Optional[str] = None
