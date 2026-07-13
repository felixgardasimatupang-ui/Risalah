"""
Meeting repository — real PostgreSQL CRUD.
All methods async, all return Pydantic models (app.models.schemas).
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import (
    Meeting as MeetingDB,
    TranscriptLine as TranscriptLineDB,
    ActionItem as ActionItemDB,
    Decision as DecisionDB,
    Minutes as MinutesDB,
)
from app.models.schemas import (
    Meeting as MeetingSchema,
    TranscriptLine as TranscriptLineSchema,
    ActionItem as ActionItemSchema,
    Decision as DecisionSchema,
    MinutesResponse as MinutesSchema,
    ProcessingStatus,
)


def _meeting_to_schema(m: MeetingDB) -> MeetingSchema:
    return MeetingSchema(
        id=m.id,
        title=m.title or "",
        date=m.date or "",
        location=m.location or "",
        language=m.language or "id",
        template_type=m.template_type or "government",
        status=ProcessingStatus(m.status) if m.status else ProcessingStatus.pending,
        audio_path=m.audio_path or "",
        audio_duration_ms=m.audio_duration_ms or 0,
        participant_count=m.participant_count or 0,
        error_message=m.error_message,
        created_at=m.created_at.isoformat() if m.created_at else "",
        updated_at=m.updated_at.isoformat() if m.updated_at else "",
    )


def _line_to_schema(l: TranscriptLineDB) -> TranscriptLineSchema:
    return TranscriptLineSchema(
        id=f"l{l.line_index}",
        speaker_name=l.speaker_name or "",
        text=l.text or "",
        timestamp_ms=l.start_ms or 0,
        confidence=l.confidence or 0.0,
    )


def _ai_to_schema(ai: ActionItemDB) -> ActionItemSchema:
    return ActionItemSchema(
        id=f"ai-{ai.id}",
        description=ai.description or "",
        pic=ai.pic,
        deadline=ai.deadline,
        priority=ai.priority or "medium",
    )


def _dec_to_schema(d: DecisionDB) -> DecisionSchema:
    return DecisionSchema(
        id=f"dec-{d.id}",
        description=d.description or "",
        category=d.category or "decision",
    )


def _minutes_to_schema(m: MinutesDB) -> MinutesSchema:
    return MinutesSchema(
        meeting_id=m.meeting_id,
        status=ProcessingStatus.completed,
        content=m.content or {},
    )


class MeetingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ---- Meeting CRUD ----

    async def create_meeting(
        self,
        title: str = "",
        language: str = "id",
        template_type: str = "government",
    ) -> MeetingSchema:
        db = MeetingDB(
            title=title,
            language=language,
            template_type=template_type,
            status=ProcessingStatus.processing.value,
        )
        self.session.add(db)
        await self.session.flush()
        return _meeting_to_schema(db)

    async def get_meeting(self, meeting_id: str) -> Optional[MeetingSchema]:
        result = await self.session.execute(
            select(MeetingDB).where(MeetingDB.id == meeting_id)
        )
        db = result.scalar_one_or_none()
        return _meeting_to_schema(db) if db else None

    async def update_meeting_status(
        self, meeting_id: str, status: ProcessingStatus, error_message: Optional[str] = None
    ) -> Optional[MeetingSchema]:
        result = await self.session.execute(
            select(MeetingDB).where(MeetingDB.id == meeting_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return None
        db.status = status.value
        db.updated_at = datetime.now(timezone.utc)
        if error_message:
            db.error_message = error_message
        await self.session.flush()
        return _meeting_to_schema(db)

    async def update_meeting_audio(
        self, meeting_id: str, audio_path: str, duration_ms: int = 0
    ) -> Optional[MeetingSchema]:
        result = await self.session.execute(
            select(MeetingDB).where(MeetingDB.id == meeting_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return None
        db.audio_path = audio_path
        db.audio_duration_ms = duration_ms
        db.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        return _meeting_to_schema(db)

    async def list_meetings(self, limit: int = 20, offset: int = 0) -> list[MeetingSchema]:
        result = await self.session.execute(
            select(MeetingDB).order_by(MeetingDB.created_at.desc()).offset(offset).limit(limit)
        )
        return [_meeting_to_schema(r) for r in result.scalars()]

    async def delete_meeting(self, meeting_id: str) -> bool:
        """Delete meeting and all related data (cascade)."""
        result = await self.session.execute(
            select(MeetingDB).where(MeetingDB.id == meeting_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return False
        await self.session.delete(db)
        await self.session.flush()
        return True

    # ---- Transcript Lines ----

    async def save_transcript_lines(
        self, meeting_id: str, lines: list[TranscriptLineSchema]
    ) -> int:
        for i, line in enumerate(lines):
            db = TranscriptLineDB(
                meeting_id=meeting_id,
                line_index=i,
                speaker_name=line.speaker_name,
                text=line.text,
                start_ms=line.timestamp_ms,
                end_ms=line.timestamp_ms + 5000,
                confidence=line.confidence,
            )
            self.session.add(db)
        await self.session.flush()
        return len(lines)

    async def get_transcript_lines(self, meeting_id: str) -> list[TranscriptLineSchema]:
        result = await self.session.execute(
            select(TranscriptLineDB)
            .where(TranscriptLineDB.meeting_id == meeting_id)
            .order_by(TranscriptLineDB.line_index)
        )
        return [_line_to_schema(r) for r in result.scalars()]

    # ---- Action Items ----

    async def save_action_items(
        self, meeting_id: str, items: list[ActionItemSchema]
    ) -> int:
        for item in items:
            db = ActionItemDB(
                meeting_id=meeting_id,
                description=item.description,
                pic=item.pic,
                deadline=item.deadline,
                priority=item.priority or "medium",
            )
            self.session.add(db)
        await self.session.flush()
        return len(items)

    async def get_action_items(self, meeting_id: str) -> list[ActionItemSchema]:
        result = await self.session.execute(
            select(ActionItemDB).where(ActionItemDB.meeting_id == meeting_id)
        )
        return [_ai_to_schema(r) for r in result.scalars()]

    # ---- Decisions ----

    async def save_decisions(self, meeting_id: str, decisions: list[DecisionSchema]) -> int:
        for d in decisions:
            db = DecisionDB(
                meeting_id=meeting_id,
                description=d.description,
                category=d.category,
            )
            self.session.add(db)
        await self.session.flush()
        return len(decisions)

    async def get_decisions(self, meeting_id: str) -> list[DecisionSchema]:
        result = await self.session.execute(
            select(DecisionDB).where(DecisionDB.meeting_id == meeting_id)
        )
        return [_dec_to_schema(r) for r in result.scalars()]

    # ---- Minutes ----

    async def save_minutes(self, meeting_id: str, content: dict, template_type: str = "government") -> MinutesSchema:
        db = MinutesDB(
            meeting_id=meeting_id,
            template_type=template_type,
            content=content,
        )
        self.session.add(db)
        await self.session.flush()
        return _minutes_to_schema(db)

    async def get_minutes(self, meeting_id: str) -> Optional[MinutesSchema]:
        result = await self.session.execute(
            select(MinutesDB).where(MinutesDB.meeting_id == meeting_id)
        )
        db = result.scalar_one_or_none()
        return _minutes_to_schema(db) if db else None

    # ---- Aggregated read ----

    async def get_full_meeting(self, meeting_id: str) -> Optional[dict]:
        meeting = await self.get_meeting(meeting_id)
        if not meeting:
            return None
        return {
            "meeting": meeting.model_dump(),
            "transcript": [l.model_dump() for l in await self.get_transcript_lines(meeting_id)],
            "action_items": [ai.model_dump() for ai in await self.get_action_items(meeting_id)],
            "decisions": [d.model_dump() for d in await self.get_decisions(meeting_id)],
            "minutes": (await self.get_minutes(meeting_id)).model_dump() if await self.get_minutes(meeting_id) else None,
        }
