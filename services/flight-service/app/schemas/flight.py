from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SegmentPrice(BaseModel):
    from_location: str
    to_location: str
    business: float
    premium: float
    economy: float

class FlightCreate(BaseModel):
    source: str
    destination: str
    stops: list[str] | None = None
    segment_prices: list[SegmentPrice | dict[str, Any]] | None = None
    business_price: float | None = None
    premium_price: float | None = None
    economy_price: float | None = None
    business_seats: int = 0
    premium_seats: int = 0
    economy_seats: int = 0
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    airline: str | None = None

class SeatResponse(BaseModel):
    id: int
    flight_id: int
    seat_number: str
    seat_type: str
    is_booked: bool

    model_config = ConfigDict(from_attributes=True)

class FlightResponse(BaseModel):
    id: int
    source: str
    destination: str
    stops: list[str] | None = None
    segment_prices: list[dict] | None = None
    business_price: float | None = None
    premium_price: float | None = None
    economy_price: float | None = None
    business_seats: int
    premium_seats: int
    economy_seats: int
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    airline: str | None = None

    model_config = ConfigDict(from_attributes=True)
