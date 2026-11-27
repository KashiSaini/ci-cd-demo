import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.routers.bookings import bookings_router
from app.services.kafka_producer import start_kafka_producer, stop_kafka_producer


async def _connect_kafka_background() -> None:
    try:
        await start_kafka_producer(retries=2, delay=2)
    except Exception as exc:
        print(f"Kafka unavailable on startup, continuing without Kafka: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    kafka_task = asyncio.create_task(_connect_kafka_background())
    yield
    kafka_task.cancel()
    try:
        await stop_kafka_producer()
    except Exception as exc:
        print(f"Kafka producer stop skipped: {exc}")


app = FastAPI(title="Booking Service", lifespan=lifespan)

app.include_router(bookings_router)