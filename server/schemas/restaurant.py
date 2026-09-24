from typing import Optional, Literal
from pydantic import BaseModel, Field


class AddressSchema(BaseModel):
    line1: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""


class NoShowPolicySchema(BaseModel):
    hours_before: int = 2
    forfeit_percent: int = 100


class BrandThemeSchema(BaseModel):
    primary_color: str = "#FF7A1A"
    background_color: str = "#FFFFFF"


class RestaurantSchema(BaseModel):
    restaurant_id: str = "rst_default"
    name: str = "Spice Symphony"
    gstin: str = ""
    address: AddressSchema = Field(default_factory=AddressSchema)
    timezone: str = "Asia/Kolkata"
    currency: str = "INR"
    sla_prep_minutes: int = 15
    reservation_deposit_default: int = 500
    no_show_forfeit_policy: NoShowPolicySchema = Field(default_factory=NoShowPolicySchema)
    brand_theme: BrandThemeSchema = Field(default_factory=BrandThemeSchema)
    status: Literal["active", "inactive"] = "active"


class RestaurantUpdateSchema(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[AddressSchema] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    sla_prep_minutes: Optional[int] = None
    reservation_deposit_default: Optional[int] = None
    no_show_forfeit_policy: Optional[NoShowPolicySchema] = None
    brand_theme: Optional[BrandThemeSchema] = None
    status: Optional[Literal["active", "inactive"]] = None
