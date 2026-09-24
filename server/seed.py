import logging
from datetime import datetime, timezone, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.restaurant import RestaurantModel
from models.table import TableModel
from models.category import CategoryModel
from models.menu_item import MenuItemModel
from models.staff import StaffModel
from models.customer import CustomerModel
from dependencies import hash_pin

logger = logging.getLogger(__name__)


async def seed_default_data(db: AsyncSession):
    # Check if restaurant exists
    res = await db.execute(select(RestaurantModel).where(RestaurantModel.restaurant_id == "rst_default"))
    if res.scalar_one_or_none():
        return  # Already seeded

    logger.info("Seeding initial restaurant and catalog data...")
    now = datetime.now(timezone.utc)

    # 1. Restaurant
    restaurant = RestaurantModel(
        restaurant_id="rst_default",
        name="Spice Symphony",
        gstin="27AADCB2230M1ZT",
        address_line1="124 Linking Road, Bandra West",
        address_city="Mumbai",
        address_state="Maharashtra",
        address_pincode="400050",
        timezone="Asia/Kolkata",
        currency="INR",
        sla_prep_minutes=15,
        reservation_deposit_default=500,
        no_show_hours_before=2,
        no_show_forfeit_percent=100,
        brand_primary_color="#FF7A1A",
        brand_bg_color="#FFFFFF",
        status="active",
        created_at=now,
        updated_at=now,
    )
    db.add(restaurant)

    # 2. Tables
    tables = [
        TableModel(
            table_id="tbl_1",
            restaurant_id="rst_default",
            label="T1",
            capacity=2,
            zone="Indoor",
            qr_token="tok_t1_sample",
            qr_issued_at=now,
            qr_version=1,
            status="vacant",
            pos_x=80,
            pos_y=80,
            created_at=now,
        ),
        TableModel(
            table_id="tbl_2",
            restaurant_id="rst_default",
            label="T2",
            capacity=4,
            zone="Indoor",
            qr_token="tok_t2_sample",
            qr_issued_at=now,
            qr_version=1,
            status="vacant",
            pos_x=200,
            pos_y=80,
            created_at=now,
        ),
        TableModel(
            table_id="tbl_3",
            restaurant_id="rst_default",
            label="T3",
            capacity=4,
            zone="Indoor",
            qr_token="tok_t3_sample",
            qr_issued_at=now,
            qr_version=1,
            status="vacant",
            pos_x=320,
            pos_y=80,
            created_at=now,
        ),
        TableModel(
            table_id="tbl_4",
            restaurant_id="rst_default",
            label="T4",
            capacity=6,
            zone="Indoor",
            qr_token="tok_t4_sample",
            qr_issued_at=now,
            qr_version=1,
            status="vacant",
            pos_x=440,
            pos_y=80,
            created_at=now,
        ),
        TableModel(
            table_id="tbl_5",
            restaurant_id="rst_default",
            label="Outdoor 1",
            capacity=4,
            zone="Outdoor",
            qr_token="tok_out1_sample",
            qr_issued_at=now,
            qr_version=1,
            status="vacant",
            pos_x=80,
            pos_y=220,
            created_at=now,
        ),
        TableModel(
            table_id="tbl_6",
            restaurant_id="rst_default",
            label="Outdoor 2",
            capacity=4,
            zone="Outdoor",
            qr_token="tok_out2_sample",
            qr_issued_at=now,
            qr_version=1,
            status="vacant",
            pos_x=200,
            pos_y=220,
            created_at=now,
        ),
    ]
    for t in tables:
        db.add(t)

    # 3. Categories
    cat_starters = CategoryModel(category_id="cat_1", restaurant_id="rst_default", name="Starters", sort_order=1)
    cat_mains = CategoryModel(category_id="cat_2", restaurant_id="rst_default", name="Mains", sort_order=2)
    cat_breads = CategoryModel(category_id="cat_3", restaurant_id="rst_default", name="Breads & Rice", sort_order=3)
    cat_desserts = CategoryModel(category_id="cat_4", restaurant_id="rst_default", name="Desserts", sort_order=4)
    cat_drinks = CategoryModel(category_id="cat_5", restaurant_id="rst_default", name="Beverages", sort_order=5)

    categories = [cat_starters, cat_mains, cat_breads, cat_desserts, cat_drinks]
    for c in categories:
        db.add(c)

    # 4. Menu Items
    menu_items = [
        MenuItemModel(
            item_id="itm_1",
            restaurant_id="rst_default",
            category_id="cat_1",
            name="Paneer Tikka",
            description="Chargrilled cottage cheese cubes marinated in spiced yogurt",
            price=320.0,
            diet_tag="veg",
            spice_level="medium",
            modifiers=[{"name": "Dip", "options": ["Mint Chutney", "Garlic Mayo"]}],
            is_available=True,
            qty_available=25,
            sort_order=1,
        ),
        MenuItemModel(
            item_id="itm_2",
            restaurant_id="rst_default",
            category_id="cat_1",
            name="Chicken Malai Tikka",
            description="Tender chicken marinated in cream, cheese and mild green cardamom",
            price=380.0,
            diet_tag="non_veg",
            spice_level="mild",
            modifiers=[],
            is_available=True,
            qty_available=18,
            sort_order=2,
        ),
        MenuItemModel(
            item_id="itm_3",
            restaurant_id="rst_default",
            category_id="cat_2",
            name="Butter Chicken",
            description="Classic tandoori chicken simmered in rich creamy tomato gravy",
            price=450.0,
            diet_tag="non_veg",
            spice_level="mild",
            modifiers=[{"name": "Portion", "options": ["Regular", "Large"]}],
            is_available=True,
            qty_available=30,
            sort_order=1,
        ),
        MenuItemModel(
            item_id="itm_4",
            restaurant_id="rst_default",
            category_id="cat_2",
            name="Dal Makhani",
            description="Slow-cooked black lentils simmered overnight with butter and fresh cream",
            price=310.0,
            diet_tag="veg",
            spice_level="mild",
            modifiers=[],
            is_available=True,
            qty_available=40,
            sort_order=2,
        ),
        MenuItemModel(
            item_id="itm_5",
            restaurant_id="rst_default",
            category_id="cat_3",
            name="Butter Garlic Naan",
            description="Crisp leavened bread infused with minced garlic and topped with melted butter",
            price=85.0,
            diet_tag="veg",
            spice_level="none",
            modifiers=[],
            is_available=True,
            qty_available=100,
            sort_order=1,
        ),
        MenuItemModel(
            item_id="itm_6",
            restaurant_id="rst_default",
            category_id="cat_4",
            name="Gulab Jamun with Rabri",
            description="Warm golden dumplings soaked in saffron syrup served alongside thick rabri",
            price=160.0,
            diet_tag="veg",
            spice_level="none",
            modifiers=[],
            is_available=True,
            qty_available=15,
            sort_order=1,
        ),
        MenuItemModel(
            item_id="itm_7",
            restaurant_id="rst_default",
            category_id="cat_5",
            name="Mango Lassi",
            description="Creamy chilled yogurt blended with Alphonso mango pulp",
            price=140.0,
            diet_tag="veg",
            spice_level="none",
            modifiers=[],
            is_available=True,
            qty_available=50,
            sort_order=1,
        ),
    ]
    for mi in menu_items:
        db.add(mi)

    # 5. Staff
    default_pin_hash = hash_pin("1234")
    admin_pin_hash = hash_pin("9211")
    staff_members = [
        StaffModel(
            staff_id="stf_1",
            restaurant_id="rst_default",
            name="Chef Sanjeev",
            role="kitchen",
            phone="+919820011223",
            pin_hash=default_pin_hash,
            is_active=True,
        ),
        StaffModel(
            staff_id="stf_2",
            restaurant_id="rst_default",
            name="Rahul Verma",
            role="waiter",
            phone="+919820022334",
            pin_hash=default_pin_hash,
            is_active=True,
        ),
        StaffModel(
            staff_id="stf_3",
            restaurant_id="rst_default",
            name="Priya Sharma",
            role="cashier",
            phone="+919820033445",
            pin_hash=default_pin_hash,
            is_active=True,
        ),
        StaffModel(
            staff_id="stf_4",
            restaurant_id="rst_default",
            name="Vikram Malhotra",
            role="admin",
            phone="+919820044556",
            pin_hash=admin_pin_hash,
            is_active=True,
        ),
    ]
    for sm in staff_members:
        db.add(sm)

    # 6. Sample Customer
    customer = CustomerModel(
        customer_id="cus_1",
        restaurant_id="rst_default",
        phone="+919876543210",
        name="Aarav Mehta",
        email="aarav@example.com",
        marketing_opt_in=True,
        visit_count=3,
        total_spent=2850.0,
        last_visit=now,
        created_at=now,
    )
    db.add(customer)

    await db.commit()
    logger.info("Initial data seeded successfully.")
