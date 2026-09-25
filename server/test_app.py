import pytest
import asyncio
from httpx import ASGITransport, AsyncClient
from main import app


@pytest.mark.asyncio
async def test_full_flow():
    from database import init_db, async_session_factory
    from seed import seed_default_data
    await init_db()
    async with async_session_factory() as session:
        await seed_default_data(session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

        # 2. Auth - Admin PIN
        res = await client.post("/api/auth/verify-pin", json={"pin": "9211"})
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["role"] == "admin"

        # Auth - Invalid PIN
        res = await client.post("/api/auth/verify-pin", json={"pin": "0000"})
        assert res.status_code == 200
        assert res.json()["success"] is False

        # 3. Restaurant
        res = await client.get("/api/restaurants")
        assert res.status_code == 200
        rst = res.json()
        assert rst["name"] == "Spice Symphony"
        assert rst["address"]["city"] == "Mumbai"

        # 4. Tables
        res = await client.get("/api/tables")
        assert res.status_code == 200
        tables = res.json()
        assert len(tables) >= 6
        t1 = tables[0]

        # Verify double slashes like //api/tables are normalized by middleware
        res_double = await client.get("http://test//api/tables")
        assert res_double.status_code == 200

        # Reissue QR
        res = await client.post(f"/api/tables/{t1['table_id']}/reissue-qr")
        assert res.status_code == 200
        assert "token" in res.json()

        # 5. Categories
        res = await client.get("/api/categories")
        assert res.status_code == 200
        cats = res.json()
        assert len(cats) >= 5

        # 6. Menu items
        res = await client.get("/api/menu-items")
        assert res.status_code == 200
        items = res.json()
        assert len(items) >= 7

        # 7. Check-in flow
        res = await client.post("/api/sessions/checkin", json={
            "table_id": t1["table_id"],
            "phone": "+919999988888",
            "name": "Test Diner",
            "email": "diner@example.com"
        })
        assert res.status_code == 200
        session = res.json()
        assert session["status"] == "active"
        assert session["table_id"] == t1["table_id"]
        assert len(session["guests"]) == 1

        # Table should now be occupied
        res = await client.get(f"/api/tables/{t1['table_id']}")
        assert res.json()["status"] == "occupied"

        # 8. Place order
        item1 = items[0]
        res = await client.post("/api/orders", json={
            "session_id": session["session_id"],
            "table_id": t1["table_id"],
            "round_number": 1,
            "placed_by": {"name": "Test Diner", "phone": "+919999988888"},
            "items": [{
                "item_id": item1["item_id"],
                "name_snapshot": item1["name"],
                "price_snapshot": item1["price"],
                "quantity": 2,
                "modifiers_selected": {},
                "special_instructions": "Less spicy please"
            }]
        })
        assert res.status_code == 200
        order = res.json()
        assert order["status"] == "placed"
        assert len(order["items"]) == 1
        assert order["subtotal"] == item1["price"] * 2

        # Update order status
        res = await client.post(f"/api/orders/{order['order_id']}/status", json={"status": "preparing"})
        assert res.status_code == 200
        assert res.json()["status"] == "preparing"

        # 9. Request Bill
        res = await client.post("/api/bills", json={
            "session_id": session["session_id"],
            "table_id": t1["table_id"],
            "discount_amount": 0.0
        })
        assert res.status_code == 200
        bill = res.json()
        assert bill["payment_status"] == "pending"
        assert bill["items_subtotal"] == order["subtotal"]
        assert bill["total_payable"] > 0

        # Table should be billing_requested
        res = await client.get(f"/api/tables/{t1['table_id']}")
        assert res.json()["status"] == "billing_requested"

        # 10. Settle Bill
        res = await client.post(f"/api/bills/{bill['bill_id']}/settle", json={
            "payment_mode": "online_upi"
        })
        assert res.status_code == 200
        settle_data = res.json()
        assert settle_data["bill"]["payment_status"] == "paid"
        assert "invoice" in settle_data
        assert settle_data["invoice"]["payment_mode"] == "online_upi"

        # Table should be vacant again
        res = await client.get(f"/api/tables/{t1['table_id']}")
        assert res.json()["status"] == "vacant"
        assert res.json()["current_session_id"] is None

        # 11. Invoices
        res = await client.get("/api/invoices")
        assert res.status_code == 200
        assert len(res.json()) >= 1

        # 12. Analytics
        res = await client.get("/api/analytics/daily-revenue")
        assert res.status_code == 200
        res = await client.get("/api/analytics/summary")
        assert res.status_code == 200
        assert res.json()["total_revenue"] > 0

        print("\nAll integration test assertions passed successfully!")


if __name__ == "__main__":
    asyncio.run(test_full_flow())
