"""
Meeting CRUD endpoints — list, get, delete meetings with full data.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.meeting_repo import MeetingRepository
from app.models.schemas import (
    Meeting as MeetingSchema,
    ProcessingStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _repo(db: AsyncSession = Depends(get_db)) -> MeetingRepository:
    return MeetingRepository(db)


@router.get("/meetings", summary="List meetings")
async def list_meetings(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: MeetingRepository = Depends(_repo),
):
    """List meetings, newest first."""
    meetings = await repo.list_meetings(limit=limit, offset=offset)
    return {
        "items": [m.model_dump() for m in meetings],
        "limit": limit,
        "offset": offset,
    }


@router.get("/meetings/{meeting_id}", summary="Get full meeting")
async def get_meeting(
    meeting_id: str,
    repo: MeetingRepository = Depends(_repo),
):
    """Get meeting with transcript, action items, decisions, and minutes."""
    full = await repo.get_full_meeting(meeting_id)
    if not full:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")
    return full


@router.delete("/meetings/{meeting_id}", summary="Delete meeting")
async def delete_meeting(
    meeting_id: str,
    repo: MeetingRepository = Depends(_repo),
):
    """Delete meeting and all related data (cascade)."""
    meeting = await repo.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")

    await repo.delete_meeting(meeting_id)
    return {"status": "deleted", "meeting_id": meeting_id}


@router.patch("/meetings/{meeting_id}/status", summary="Update meeting status")
async def update_meeting_status(
    meeting_id: str,
    status: ProcessingStatus,
    error_message: str = None,
    repo: MeetingRepository = Depends(_repo),
):
    """Update meeting processing status."""
    updated = await repo.update_meeting_status(meeting_id, status, error_message)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")
    return updated.model_dump()
