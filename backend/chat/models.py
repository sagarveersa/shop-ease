# models/chat_session.py

import enum
from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


# ---- ENUM ----
class ChatStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)

    # FK → accounts_user table
    customer_id = Column(
        Integer,
        ForeignKey("accounts_user.id", ondelete="CASCADE"),
        nullable=False
    )

    staff_id = Column(
        Integer,
        ForeignKey("accounts_user.id", ondelete="SET NULL"),
        nullable=True
    )

    status = Column(
        Enum(ChatStatus, name="chat_status"),
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
    customer = relationship(
        "User",
        foreign_keys=[customer_id],
        backref="customer_chat_sessions"
    )

    staff = relationship(
        "User",
        foreign_keys=[staff_id],
        backref="staff_chat_sessions"
    )

