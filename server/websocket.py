import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections per restaurant."""

    def __init__(self):
        # Map restaurant_id -> set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, restaurant_id: str = "rst_default"):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = set()
        self.active_connections[restaurant_id].add(websocket)
        logger.info(f"WebSocket connected for restaurant: {restaurant_id} (total: {len(self.active_connections[restaurant_id])})")

    def disconnect(self, websocket: WebSocket, restaurant_id: str = "rst_default"):
        if restaurant_id in self.active_connections:
            self.active_connections[restaurant_id].discard(websocket)
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]
        logger.info(f"WebSocket disconnected for restaurant: {restaurant_id}")

    async def broadcast(self, restaurant_id: str, event: dict):
        """Broadcast an event dictionary to all connections subscribed to restaurant_id."""
        if restaurant_id not in self.active_connections:
            return

        dead_connections = set()
        payload = json.dumps(event)
        for websocket in list(self.active_connections[restaurant_id]):
            try:
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending websocket message: {e}")
                dead_connections.add(websocket)

        for dead in dead_connections:
            self.active_connections[restaurant_id].discard(dead)


manager = ConnectionManager()
