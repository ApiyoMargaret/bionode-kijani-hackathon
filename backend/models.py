from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, DateTime, Float, String, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AlertType(str, Enum):
    FLOOD = "FLOOD"
    POLLUTION_SPIKE = "POLLUTION_SPIKE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    last_known_location: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class SensorLog(Base):
    __tablename__ = "sensor_logs"

    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    water_height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    turbidity_ntu: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[dict] = mapped_column(JSON, nullable=True)


class AlertHistory(Base):
    __tablename__ = "alert_history"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(32), nullable=False)
    rate_shift_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    broadcast_radius_km: Mapped[float] = mapped_column(Float, nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    summary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    relay_state: Mapped[str | None] = mapped_column(String(64), nullable=True)
