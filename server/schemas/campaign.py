from typing import Optional, Literal
from pydantic import BaseModel, Field

CampaignChannel = Literal["whatsapp", "email", "both"]
CampaignStatus = Literal["draft", "scheduled", "sent"]


class AudienceFilterSchema(BaseModel):
    last_visit_within_days: int = 90
    min_orders: int = 1


class CampaignSchema(BaseModel):
    campaign_id: str
    name: str
    channel: CampaignChannel = "both"
    template_id: str = ""
    message_body: str = ""
    audience_filter: AudienceFilterSchema = Field(default_factory=AudienceFilterSchema)
    scheduled_at: Optional[int] = None  # Epoch ms
    sent_count: int = 0
    opened_count: int = 0
    redeemed_count: int = 0
    status: CampaignStatus = "draft"


class CampaignCreateSchema(BaseModel):
    name: str
    channel: CampaignChannel = "both"
    template_id: str = ""
    message_body: str = ""
    audience_filter: AudienceFilterSchema = Field(default_factory=AudienceFilterSchema)
    scheduled_at: Optional[int] = None
    status: CampaignStatus = "draft"


class CampaignUpdateSchema(BaseModel):
    name: Optional[str] = None
    channel: Optional[CampaignChannel] = None
    template_id: Optional[str] = None
    message_body: Optional[str] = None
    audience_filter: Optional[AudienceFilterSchema] = None
    scheduled_at: Optional[int] = None
    sent_count: Optional[int] = None
    opened_count: Optional[int] = None
    redeemed_count: Optional[int] = None
    status: Optional[CampaignStatus] = None
