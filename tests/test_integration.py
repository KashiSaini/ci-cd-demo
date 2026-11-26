import os
import sys
import pytest
import asyncpg
import redis.asyncio as aioredis
from fastapi.testclient import TestClient

# Allow importing auth-service app + shared modules
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("services/auth-service"))


@pytest.mark.asyncio
async def test_postgres_connection():
    db_url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(db_url)
    result = await conn.fetchval("SELECT 1")
    await conn.close()
    assert result == 1


@pytest.mark.asyncio
async def test_redis_connection():
    client = aioredis.from_url(os.environ["REDIS_URL"])
    assert await client.ping() is True
    await client.aclose()


def test_auth_service_openapi_boots():
    from app.main import app
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200