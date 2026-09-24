from routers.auth import router as auth_router
from routers.restaurants import router as restaurants_router
from routers.tables import router as tables_router
from routers.categories import router as categories_router
from routers.menu import router as menu_router
from routers.staff import router as staff_router
from routers.sessions import router as sessions_router
from routers.orders import router as orders_router
from routers.bills import router as bills_router
from routers.invoices import router as invoices_router
from routers.customers import router as customers_router
from routers.reservations import router as reservations_router
from routers.campaigns import router as campaigns_router
from routers.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "restaurants_router",
    "tables_router",
    "categories_router",
    "menu_router",
    "staff_router",
    "sessions_router",
    "orders_router",
    "bills_router",
    "invoices_router",
    "customers_router",
    "reservations_router",
    "campaigns_router",
    "analytics_router",
]
