from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from models.restaurant import RestaurantModel
from models.table import TableModel
from models.category import CategoryModel
from models.menu_item import MenuItemModel
from models.staff import StaffModel
from models.customer import CustomerModel
from models.reservation import ReservationModel
from models.session import SessionModel
from models.order import OrderModel
from models.order_item import OrderItemModel
from models.bill import BillModel
from models.invoice import InvoiceModel
from models.campaign import CampaignModel

from schemas.restaurant import RestaurantSchema, AddressSchema, NoShowPolicySchema, BrandThemeSchema
from schemas.table import TableSchema, PositionSchema
from schemas.category import CategorySchema
from schemas.menu_item import MenuItemSchema, MenuModifierSchema
from schemas.staff import StaffSchema
from schemas.customer import CustomerSchema
from schemas.reservation import ReservationSchema
from schemas.session import SessionSchema, GuestSchema
from schemas.order import OrderSchema, OrderItemSchema, PlacedBySchema
from schemas.bill import BillSchema
from schemas.invoice import InvoiceSchema, InvoiceLineItemSchema
from schemas.campaign import CampaignSchema, AudienceFilterSchema
from dependencies import dt_to_epoch_ms


def to_restaurant_schema(m: RestaurantModel) -> RestaurantSchema:
    return RestaurantSchema(
        restaurant_id=m.restaurant_id,
        name=m.name,
        gstin=m.gstin or "",
        address=AddressSchema(
            line1=m.address_line1 or "",
            city=m.address_city or "",
            state=m.address_state or "",
            pincode=m.address_pincode or "",
        ),
        timezone=m.timezone or "Asia/Kolkata",
        currency=m.currency or "INR",
        sla_prep_minutes=m.sla_prep_minutes,
        reservation_deposit_default=m.reservation_deposit_default,
        no_show_forfeit_policy=NoShowPolicySchema(
            hours_before=m.no_show_hours_before,
            forfeit_percent=m.no_show_forfeit_percent,
        ),
        brand_theme=BrandThemeSchema(
            primary_color=m.brand_primary_color or "#FF7A1A",
            background_color=m.brand_bg_color or "#FFFFFF",
        ),
        status=m.status or "active",
    )


def to_table_schema(m: TableModel) -> TableSchema:
    return TableSchema(
        table_id=m.table_id,
        label=m.label,
        capacity=m.capacity,
        zone=m.zone,
        qr_token=m.qr_token,
        qr_issued_at=dt_to_epoch_ms(m.qr_issued_at) or 0,
        qr_version=m.qr_version,
        status=m.status,
        current_session_id=m.current_session_id,
        position=PositionSchema(x=m.pos_x, y=m.pos_y),
        call_waiter_active=m.call_waiter_active,
        call_waiter_reason=m.call_waiter_reason,
        call_waiter_time=dt_to_epoch_ms(m.call_waiter_time),
    )


def to_category_schema(m: CategoryModel) -> CategorySchema:
    return CategorySchema(
        category_id=m.category_id,
        name=m.name,
        sort_order=m.sort_order,
        is_active=m.is_active,
    )


def to_menu_item_schema(m: MenuItemModel) -> MenuItemSchema:
    mods = []
    if m.modifiers and isinstance(m.modifiers, list):
        for mod in m.modifiers:
            if isinstance(mod, dict):
                mods.append(MenuModifierSchema(name=mod.get("name", ""), options=mod.get("options", [])))
    return MenuItemSchema(
        item_id=m.item_id,
        category_id=m.category_id,
        name=m.name,
        description=m.description or "",
        price=float(m.price),
        currency=m.currency or "INR",
        image_url=m.image_url or "",
        diet_tag=m.diet_tag,
        spice_level=m.spice_level,
        modifiers=mods,
        is_available=m.is_available,
        qty_available=m.qty_available,
        sort_order=m.sort_order,
    )


def to_staff_schema(m: StaffModel) -> StaffSchema:
    return StaffSchema(
        staff_id=m.staff_id,
        name=m.name,
        role=m.role,
        phone=m.phone or "",
        is_active=m.is_active,
    )


def to_customer_schema(m: CustomerModel) -> CustomerSchema:
    return CustomerSchema(
        customer_id=m.customer_id,
        phone=m.phone,
        name=m.name or "",
        email=m.email or "",
        marketing_opt_in=m.marketing_opt_in,
        visit_count=m.visit_count,
        total_spent=float(m.total_spent or 0.0),
        last_visit=dt_to_epoch_ms(m.last_visit),
        created_at=dt_to_epoch_ms(m.created_at) or 0,
    )


def to_reservation_schema(m: ReservationModel) -> ReservationSchema:
    return ReservationSchema(
        reservation_id=m.reservation_id,
        customer_phone=m.customer_phone,
        customer_name=m.customer_name,
        party_size=m.party_size,
        reserved_for_date=str(m.reserved_for_date),
        time_slot=m.time_slot,
        table_preference=m.table_preference or "",
        deposit_amount=float(m.deposit_amount or 0.0),
        deposit_payment_id=m.deposit_payment_id or "",
        deposit_status=m.deposit_status,
        status=m.status,
        reminder_sent_at=dt_to_epoch_ms(m.reminder_sent_at),
        notes=m.notes or "",
        created_at=dt_to_epoch_ms(m.created_at) or 0,
    )


def to_session_schema(m: SessionModel) -> SessionSchema:
    guests = []
    if m.guests and isinstance(m.guests, list):
        for g in m.guests:
            if isinstance(g, dict):
                guests.append(GuestSchema(
                    name=g.get("name", ""),
                    phone=g.get("phone", ""),
                    joined_at=g.get("joined_at", 0),
                ))
    return SessionSchema(
        session_id=m.session_id,
        table_id=m.table_id,
        status=m.status,
        guests=guests,
        reservation_id=m.reservation_id,
        checkin_at=dt_to_epoch_ms(m.checkin_at) or 0,
        expires_at=dt_to_epoch_ms(m.expires_at) or 0,
        closed_at=dt_to_epoch_ms(m.closed_at),
        close_reason=m.close_reason,
    )


def to_order_item_schema(m: OrderItemModel) -> OrderItemSchema:
    return OrderItemSchema(
        order_item_id=m.order_item_id,
        item_id=m.item_id,
        name_snapshot=m.name_snapshot,
        price_snapshot=float(m.price_snapshot),
        quantity=m.quantity,
        modifiers_selected=m.modifiers_selected or {},
        special_instructions=m.special_instructions or "",
        status=m.status,
    )


def to_order_schema(m: OrderModel) -> OrderSchema:
    items = [to_order_item_schema(item) for item in (m.items or [])]
    return OrderSchema(
        order_id=m.order_id,
        session_id=m.session_id,
        table_id=m.table_id,
        round_number=m.round_number,
        placed_at=dt_to_epoch_ms(m.placed_at) or 0,
        placed_by=PlacedBySchema(name=m.placed_by_name or "", phone=m.placed_by_phone or ""),
        status=m.status,
        sla_deadline=dt_to_epoch_ms(m.sla_deadline) or 0,
        sla_breached=m.sla_breached,
        items=items,
        subtotal=float(m.subtotal or 0.0),
        updated_at=dt_to_epoch_ms(m.updated_at) or 0,
    )


def to_bill_schema(m: BillModel) -> BillSchema:
    return BillSchema(
        bill_id=m.bill_id,
        session_id=m.session_id,
        table_id=m.table_id,
        order_ids=m.order_ids or [],
        items_subtotal=float(m.items_subtotal or 0.0),
        discount_amount=float(m.discount_amount or 0.0),
        gst_rate=float(m.gst_rate or 5.0),
        gst_amount=float(m.gst_amount or 0.0),
        reservation_credit_applied=float(m.reservation_credit_applied or 0.0),
        total_payable=float(m.total_payable or 0.0),
        payment_mode=m.payment_mode,
        payment_status=m.payment_status,
        requested_at=dt_to_epoch_ms(m.requested_at) or 0,
        settled_at=dt_to_epoch_ms(m.settled_at),
        settled_by_staff_id=m.settled_by_staff_id,
    )


def to_invoice_schema(m: InvoiceModel) -> InvoiceSchema:
    line_items = []
    if m.items and isinstance(m.items, list):
        for itm in m.items:
            if isinstance(itm, dict):
                line_items.append(InvoiceLineItemSchema(
                    name=itm.get("name", ""),
                    price=float(itm.get("price", 0.0)),
                    quantity=int(itm.get("quantity", 1)),
                    amount=float(itm.get("amount", 0.0)),
                ))
    return InvoiceSchema(
        invoice_id=m.invoice_id,
        bill_id=m.bill_id,
        invoice_number=m.invoice_number,
        gstin=m.gstin or "",
        restaurant_name=m.restaurant_name,
        restaurant_address=AddressSchema(
            line1="",
            city="",
            state="",
            pincode="",
        ),
        customer_name=m.customer_name,
        customer_phone=m.customer_phone,
        customer_email=m.customer_email or "",
        items=line_items,
        items_subtotal=float(m.items_subtotal or 0.0),
        discount_amount=float(m.discount_amount or 0.0),
        gst_rate=float(m.gst_rate or 5.0),
        gst_amount=float(m.gst_amount or 0.0),
        reservation_credit=float(m.reservation_credit or 0.0),
        total_paid=float(m.total_paid or 0.0),
        payment_mode=m.payment_mode,
        issued_at=dt_to_epoch_ms(m.issued_at) or 0,
        whatsapp_status=m.whatsapp_status,
        email_status=m.email_status,
    )


def to_campaign_schema(m: CampaignModel) -> CampaignSchema:
    return CampaignSchema(
        campaign_id=m.campaign_id,
        name=m.name,
        channel=m.channel,
        template_id=m.template_id or "",
        message_body=m.message_body or "",
        audience_filter=AudienceFilterSchema(
            last_visit_within_days=m.audience_last_visit_days or 90,
            min_orders=m.audience_min_orders or 1,
        ),
        scheduled_at=dt_to_epoch_ms(m.scheduled_at),
        sent_count=m.sent_count,
        opened_count=m.opened_count,
        redeemed_count=m.redeemed_count,
        status=m.status,
    )
