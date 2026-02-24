# models/chat_session.py

import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    UUID,
    Text,
    ForeignKey,
    Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from database import Base
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

class DjangoUser(Base):
    __tablename__="accounts_user"

    id = Column(UUID(as_uuid=True), default=uuid4, primary_key=True)

# ---- ENUM ----
class ChatStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "closed"


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(UUID(as_uuid=True), default=uuid4, primary_key=True, index=True)

    # FK → accounts_user table
    guest_id = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    staff_id = Column(
        UUID(as_uuid=True),
        ForeignKey("accounts_user.id", ondelete="SET NULL"),
        nullable=True
    )

    status = Column(
        Enum(ChatStatus, name="room_status"),
        default=ChatStatus.ACTIVE,
        nullable=False
    )

    created = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    lastUpdated = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # ---- relationships ----

    staff = relationship(
        "DjangoUser",
        foreign_keys=[staff_id],
        backref="staff_chat_sessions"
    )

class SenderType(str, enum.Enum):
    STAFF = "staff"
    GUEST = "guest"

class RoomMessage(Base):
    __tablename__ = "room_messages"

    id = Column(UUID(as_uuid=True), default=uuid4, primary_key=True, index=True)
    sender = Column(Enum(SenderType, name="sender_type"))
    content = Column(Text)
    created_at = Column(DateTime, default=utc_now, nullable=False) 
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
