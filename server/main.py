import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, async_session_factory
from models import Base
from seed import seed_default_data
from websocket import manager

from routers import (
    auth_router,
    restaurants_router,
    tables_router,
    categories_router,
    menu_router,
    staff_router,
    sessions_router,
    orders_router,
    bills_router,
    invoices_router,
    customers_router,
    reservations_router,
    campaigns_router,
    analytics_router,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist
    logger.info("Initializing database...")
    from database import init_db
    await init_db()

    # Seed default data
    async with async_session_factory() as session:
        await seed_default_data(session)

    yield

    # Shutdown
    logger.info("Shutting down database connection...")
    await engine.dispose()


from starlette.types import ASGIApp, Scope, Receive, Send


class NormalizePathMiddleware:
    """Collapses duplicate slashes in incoming request paths (e.g. //api/tables -> /api/tables)."""
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            while "//" in path:
                path = path.replace("//", "/")
            scope["path"] = path
        await self.app(scope, receive, send)


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(NormalizePathMiddleware)

# CORS Middleware
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
api_prefix = "/api"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(restaurants_router, prefix=api_prefix)
app.include_router(tables_router, prefix=api_prefix)
app.include_router(categories_router, prefix=api_prefix)
app.include_router(menu_router, prefix=api_prefix)
app.include_router(staff_router, prefix=api_prefix)
app.include_router(sessions_router, prefix=api_prefix)
app.include_router(orders_router, prefix=api_prefix)
app.include_router(bills_router, prefix=api_prefix)
app.include_router(invoices_router, prefix=api_prefix)
app.include_router(customers_router, prefix=api_prefix)
app.include_router(reservations_router, prefix=api_prefix)
app.include_router(campaigns_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)


# Health check
@app.get("/")
@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


# Realtime WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    restaurant_id: str = Query("rst_default"),
):
    await manager.connect(websocket, restaurant_id=restaurant_id)
    try:
        while True:
            # Keep connection open; clients can also send ping / messages if desired
            data = await websocket.receive_text()
            # Echo or acknowledge
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, restaurant_id=restaurant_id)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket, restaurant_id=restaurant_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
