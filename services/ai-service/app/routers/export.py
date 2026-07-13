"""
Export router — generate DOCX notulen for a meeting.
"""
import os
import tempfile
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.meeting_repo import MeetingRepository
from app.services.export_service import export_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _repo(db: AsyncSession = Depends(get_db)) -> MeetingRepository:
    return MeetingRepository(db)


@router.get("/meetings/{meeting_id}/export", summary="Export notulen as DOCX")
async def export_meeting(
    meeting_id: str,
    repo: MeetingRepository = Depends(_repo),
):
    """Generate DOCX notulen for a completed meeting."""
    full = await repo.get_full_meeting(meeting_id)
    if not full:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")

    meeting_data = full["meeting"]
    transcript = full["transcript"]
    action_items = full["action_items"]
    decisions = full["decisions"]
    minutes_data = full.get("minutes")

    # Convert dict to schema objects
    from app.models.schemas import Meeting as MeetingSchema, TranscriptLine, ActionItem, Decision
    from app.models.schemas import ProcessingStatus

    meeting = MeetingSchema(**meeting_data)
    lines = [TranscriptLine(**l) for l in transcript]
    items = [ActionItem(**ai) for ai in action_items]
    decs = [Decision(**d) for d in decisions]
    minutes_content = minutes_data["content"] if minutes_data else {}

    # Generate DOCX
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
    tmp.close()

    try:
        output = export_service.export_to_docx(
            meeting=meeting,
            transcript=lines,
            action_items=items,
            decisions=decs,
            minutes_content=minutes_content,
            output_path=tmp.name,
        )

        filename = f"notulen_{meeting_id}_{meeting.title or 'rapat'}.docx"
        filename = "".join(c for c in filename if c.isalnum() or c in "._- ")

        return FileResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=filename,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)
        logger.exception(f"Export failed for {meeting_id}")
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")
