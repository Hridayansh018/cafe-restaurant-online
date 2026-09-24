from typing import Optional, List, Literal
from pydantic import BaseModel, Field

DietTag = Literal["veg", "non_veg", "egg", "vegan"]
SpiceLevel = Literal["none", "mild", "medium", "hot"]


class MenuModifierSchema(BaseModel):
    name: str
    options: List[str] = Field(default_factory=list)


class MenuItemSchema(BaseModel):
    item_id: str
    category_id: str
    name: str
    description: str = ""
    price: float
    currency: str = "INR"
    image_url: str = ""
    diet_tag: DietTag = "veg"
    spice_level: SpiceLevel = "mild"
    modifiers: List[MenuModifierSchema] = Field(default_factory=list)
    is_available: bool = True
    qty_available: Optional[int] = None
    sort_order: int = 0


class MenuItemCreateSchema(BaseModel):
    category_id: str
    name: str
    description: str = ""
    price: float
    currency: str = "INR"
    image_url: str = ""
    diet_tag: DietTag = "veg"
    spice_level: SpiceLevel = "mild"
    modifiers: List[MenuModifierSchema] = Field(default_factory=list)
    is_available: bool = True
    qty_available: Optional[int] = None
    sort_order: int = 0


class MenuItemUpdateSchema(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    image_url: Optional[str] = None
    diet_tag: Optional[DietTag] = None
    spice_level: Optional[SpiceLevel] = None
    modifiers: Optional[List[MenuModifierSchema]] = None
    is_available: Optional[bool] = None
    qty_available: Optional[int] = None
    sort_order: Optional[int] = None
