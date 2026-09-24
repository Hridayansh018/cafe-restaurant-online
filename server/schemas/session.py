from typing import Optional, List, Literal
from pydantic import BaseModel, Field

SessionStatus = Literal["active", "closed", "expired"]
CloseReason = Literal["settled", "manual_reset", "idle_timeout"]


class GuestSchema(BaseModel):
    name: str
    phone: str
    joined_at: int  # Epoch ms


class SessionSchema(BaseModel):
    session_id: str
    table_id: str
    status: SessionStatus = "active"
    guests: List[GuestSchema] = Field(default_factory=list)
    reservation_id: Optional[str] = None
    checkin_at: int  # Epoch ms
    expires_at: int  # Epoch ms
    closed_at: Optional[int] = None
    close_reason: Optional[CloseReason] = None


class CheckInRequestSchema(BaseModel):
    table_id: str
    phone: str
    name: str
    email: Optional[str] = ""
    reservation_id: Optional[str] = None
    guests: Optional[List[GuestSchema]] = None


class SessionUpdateSchema(BaseModel):
    status: Optional[SessionStatus] = None
    guests: Optional[List[GuestSchema]] = None
    closed_at: Optional[int] = None
    close_reason: Optional[CloseReason] = None
