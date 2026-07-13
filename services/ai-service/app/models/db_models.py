"""
SQLAlchemy ORM models — meetings, transcripts, minutes, action items.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def _ulid() -> str:
    return uuid.uuid4().hex[:12]


def _now():
    return datetime.now(timezone.utc)


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(12), primary_key=True, default=_ulid)
    title = Column(String(255), default="")
    date = Column(String(64), default="")
    location = Column(String(255), default="")
    language = Column(String(10), default="id")
    template_type = Column(String(32), default="government")
    status = Column(String(32), default="pending")  # pending | processing | completed | failed
    audio_path = Column(String(512), default="")
    audio_duration_ms = Column(Integer, default=0)
    participant_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    transcript_lines = relationship("TranscriptLine", back_populates="meeting", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="meeting", cascade="all, delete-orphan")
    minutes = relationship("Minutes", back_populates="meeting", uselist=False, cascade="all, delete-orphan")


class TranscriptLine(Base):
    __tablename__ = "transcript_lines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String(12), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    line_index = Column(Integer, default=0)
    speaker_name = Column(String(128), default="")
    text = Column(Text, default="")
    start_ms = Column(Integer, default=0)
    end_ms = Column(Integer, default=0)
    confidence = Column(Float, default=0.0)
    language = Column(String(10), default="id")

    meeting = relationship("Meeting", back_populates="transcript_lines")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String(12), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, default="")
    pic = Column(String(128), nullable=True)
    deadline = Column(String(64), nullable=True)
    priority = Column(String(16), default="medium")
    status = Column(String(16), default="open")

    meeting = relationship("Meeting", back_populates="action_items")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String(12), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, default="")
    category = Column(String(32), default="decision")

    meeting = relationship("Meeting", back_populates="decisions")


class Minutes(Base):
    __tablename__ = "minutes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(String(12), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    template_type = Column(String(32), default="government")
    content = Column(JSON, default=dict)
    generated_at = Column(DateTime, default=_now)

    meeting = relationship("Meeting", back_populates="minutes")
