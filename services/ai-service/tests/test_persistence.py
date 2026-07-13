"""
Real E2E test: database persistence + audio storage.
No mocks — tests actual SQLAlchemy models, repository CRUD, and audio storage.
"""
import os
import sys
import tempfile

os.environ["RISALAH_DATABASE_URL"] = "sqlite+aiosqlite:///./test_e2e.db"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import pytest_asyncio
from app.database import init_db, async_session, engine
from app.repositories.meeting_repo import MeetingRepository
from app.models.schemas import (
    ProcessingStatus, TranscriptLine, ActionItem, Decision,
)
from app.services.audio_storage import AudioStorage


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()
    yield
    await engine.dispose()
    if os.path.exists("test_e2e.db"):
        os.unlink("test_e2e.db")


@pytest_asyncio.fixture
async def repo():
    async with async_session() as session:
        yield MeetingRepository(session)


@pytest.mark.asyncio
async def test_repo_create_meeting(repo):
    meeting = await repo.create_meeting(
        title="Rapat Anggaran 2025",
        language="id",
        template_type="government",
    )
    assert meeting.id
    assert meeting.status == ProcessingStatus.processing
    assert meeting.title == "Rapat Anggaran 2025"

    fetched = await repo.get_meeting(meeting.id)
    assert fetched is not None
    assert fetched.id == meeting.id

    updated = await repo.update_meeting_status(meeting.id, ProcessingStatus.completed)
    assert updated.status == ProcessingStatus.completed


@pytest.mark.asyncio
async def test_repo_save_transcript_lines(repo):
    meeting = await repo.create_meeting(title="Test Transcript")
    lines = [
        TranscriptLine(id="l1", speaker_name="Andi", text="Halo", timestamp_ms=0, confidence=0.95),
        TranscriptLine(id="l2", speaker_name="Budi", text="Test", timestamp_ms=1000, confidence=0.90),
    ]
    count = await repo.save_transcript_lines(meeting.id, lines)
    assert count == 2

    fetched = await repo.get_transcript_lines(meeting.id)
    assert len(fetched) == 2
    assert fetched[0].speaker_name == "Andi"


@pytest.mark.asyncio
async def test_repo_save_action_items_and_decisions(repo):
    meeting = await repo.create_meeting(title="Test Context")
    items = [ActionItem(id="ai-1", description="Revisi anggaran", pic="Biro Keuangan", deadline="2025-01-15", priority="high")]
    decisions = [Decision(id="dec-1", description="Anggaran dinaikkan 10%", category="approval")]

    assert await repo.save_action_items(meeting.id, items) == 1
    assert await repo.save_decisions(meeting.id, decisions) == 1

    fetched_items = await repo.get_action_items(meeting.id)
    assert len(fetched_items) == 1
    assert fetched_items[0].description == "Revisi anggaran"

    fetched_dec = await repo.get_decisions(meeting.id)
    assert len(fetched_dec) == 1
    assert fetched_dec[0].category == "approval"


@pytest.mark.asyncio
async def test_repo_save_minutes(repo):
    meeting = await repo.create_meeting(title="Test Minutes")
    content = {"title": "Notulen Test", "summary": "Ringkasan rapat"}
    mins = await repo.save_minutes(meeting.id, content, "government")
    assert mins.meeting_id == meeting.id
    assert mins.content["title"] == "Notulen Test"

    fetched = await repo.get_minutes(meeting.id)
    assert fetched is not None
    assert fetched.content["summary"] == "Ringkasan rapat"


@pytest.mark.asyncio
async def test_repo_full_meeting(repo):
    meeting = await repo.create_meeting(title="Full Test")
    lines = [TranscriptLine(id="l1", speaker_name="X", text="Test", timestamp_ms=0, confidence=0.9)]
    items = [ActionItem(id="ai-1", description="Task A", pic="PIC", deadline="2025-06-01", priority="medium")]
    decisions = [Decision(id="dec-1", description="Decision A", category="approval")]

    await repo.save_transcript_lines(meeting.id, lines)
    await repo.save_action_items(meeting.id, items)
    await repo.save_decisions(meeting.id, decisions)
    await repo.save_minutes(meeting.id, {"title": "Notulen"})

    full = await repo.get_full_meeting(meeting.id)
    assert full is not None
    assert full["meeting"]["title"] == "Full Test"
    assert len(full["transcript"]) == 1
    assert len(full["action_items"]) == 1
    assert len(full["decisions"]) == 1
    assert full["minutes"]["content"]["title"] == "Notulen"


@pytest.mark.asyncio
async def test_audio_storage_save_and_delete():
    storage = AudioStorage()

    import wave
    import struct
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp.close()
    with wave.open(tmp.name, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(struct.pack("<h", 0) * 16000)

    with open(tmp.name, "rb") as f:
        content = f.read()
    os.unlink(tmp.name)

    saved = storage.save_upload(content, "test.wav")
    assert saved.endswith("audio_16k.wav")
    assert os.path.exists(saved)

    duration = storage.get_duration_ms(saved)
    assert duration == 1000

    storage.delete_audio(saved)
    assert not os.path.exists(saved)
