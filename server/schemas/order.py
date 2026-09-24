from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field

OrderStatus = Literal["placed", "preparing", "ready", "served", "cancelled"]
ItemStatus = Literal["placed", "preparing", "ready", "served"]


class PlacedBySchema(BaseModel):
    name: str = ""
    phone: str = ""


class OrderItemSchema(BaseModel):
    order_item_id: str
    item_id: str
    name_snapshot: str
    price_snapshot: float
    quantity: int = 1
    modifiers_selected: Dict[str, str] = Field(default_factory=dict)
    special_instructions: str = ""
    status: ItemStatus = "placed"


class OrderItemCreateSchema(BaseModel):
    item_id: str
    name_snapshot: str
    price_snapshot: float
    quantity: int = 1
    modifiers_selected: Dict[str, str] = Field(default_factory=dict)
    special_instructions: str = ""


class OrderSchema(BaseModel):
    order_id: str
    session_id: str
    table_id: str
    round_number: int = 1
    placed_at: int  # Epoch ms
    placed_by: PlacedBySchema = Field(default_factory=PlacedBySchema)
    status: OrderStatus = "placed"
    sla_deadline: int  # Epoch ms
    sla_breached: bool = False
    items: List[OrderItemSchema] = Field(default_factory=list)
    subtotal: float = 0.0
    updated_at: int  # Epoch ms


class OrderCreateSchema(BaseModel):
    session_id: str
    table_id: str
    round_number: int = 1
    placed_by: PlacedBySchema = Field(default_factory=PlacedBySchema)
    items: List[OrderItemCreateSchema]


class OrderStatusUpdateSchema(BaseModel):
    status: OrderStatus


class OrderItemStatusUpdateSchema(BaseModel):
    status: ItemStatus
