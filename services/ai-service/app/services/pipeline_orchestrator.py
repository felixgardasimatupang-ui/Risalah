"""
Pipeline Orchestrator — VAD → NoiseReduce → WhisperX → Diarization → GovKB → Context → Minutes → RAG
"""
import os
import tempfile
import asyncio
import logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from enum import Enum

from app.config import settings
from app.models.schemas import (
    ProcessingStatus, TranscriptionResponse, DiarizationResponse,
    ContextResponse, MinutesResponse, TranscriptLine,
)

logger = logging.getLogger(__name__)


class PipelineStep(str, Enum):
    """Named steps in the AI pipeline."""
    VAD = "vad"
    NOISE_REDUCTION = "noise_reduction"
    TRANSCRIPTION = "transcription"
    DIARIZATION = "diarization"
    GOVERNMENT_CONTEXT = "government_context"
    CONTEXT_ANALYSIS = "context_analysis"
    MINUTES_GENERATION = "minutes_generation"
    RAG_INDEX = "rag_index"


@dataclass
class PipelineResult:
    meeting_id: str
    status: ProcessingStatus
    transcription: Optional[TranscriptionResponse] = None
    diarization: Optional[DiarizationResponse] = None
    context: Optional[ContextResponse] = None
    minutes: Optional[MinutesResponse] = None
    audio_path: Optional[str] = None
    error: Optional[str] = None
    completed_steps: list[PipelineStep] = field(default_factory=list)


@dataclass
class PipelineConfig:
    language: str = "id"
    diarize: bool = True
    num_speakers: Optional[int] = None
    noise_reduction: bool = True
    vad_filter: bool = True
    generate_minutes: bool = True
    template_type: str = "government"


class PipelineOrchestrator:
    """
    Orchestrates the full AI pipeline:
    Audio → VAD → NoiseReduce → WhisperX → Pyannote → GovKB → Context → Minutes → RAG
    """

    def __init__(self):
        self._services_loaded = False
        self._repo = None

    async def __repo(self):
        """Lazy-init repository."""
        if self._repo is None:
            from app.database import async_session
            from app.repositories.meeting_repo import MeetingRepository
            session = async_session()
            self._repo = MeetingRepository(session)
        return self._repo

    # ----------------------------------------------------------------
    # Public API
    # ----------------------------------------------------------------

    async def run_pipeline(
        self,
        audio_path: str,
        meeting_id: str,
        config: Optional[PipelineConfig] = None,
    ) -> PipelineResult:
        """
        Run full pipeline from audio file path.
        Each step is isolated — failure in one step does not block the next.
        """
        cfg = config or PipelineConfig()
        result = PipelineResult(meeting_id=meeting_id, status=ProcessingStatus.processing)

        work_path = audio_path
        result.audio_path = audio_path

        # DB persistence
        repo = await self.__repo()

        try:
            # Persist: create meeting
            try:
                await repo.update_meeting_status(meeting_id, ProcessingStatus.processing)
            except Exception:
                pass  # meeting might not exist yet
            # Prepare working copy (resample to 16kHz mono)
            work_path = self._prepare_audio(audio_path)
            result.audio_path = work_path
            # Step 1: VAD (Voice Activity Detection)
            if cfg.vad_filter:
                work_path = await self._step_vad(work_path, result, cfg)
                result.completed_steps.append(PipelineStep.VAD)

            # Step 2: Noise Reduction
            if cfg.noise_reduction:
                work_path = await self._step_noise_reduction(work_path, result, cfg)
                result.completed_steps.append(PipelineStep.NOISE_REDUCTION)

            # Step 3: Transcription (WhisperX)
            transcription = await self._step_transcription(work_path, meeting_id, result, cfg)
            if not transcription:
                result.status = ProcessingStatus.failed
                return result
            result.completed_steps.append(PipelineStep.TRANSCRIPTION)

            # Step 4: Diarization (Pyannote)
            diarization = None
            if cfg.diarize:
                diarization = await self._step_diarization(work_path, result, cfg)
                result.completed_steps.append(PipelineStep.DIARIZATION)

            # Step 5: GovKB + Context Extraction
            context = await self._step_context(transcription, result)
            result.completed_steps.append(PipelineStep.CONTEXT_ANALYSIS)

            # Step 6: Minutes Generation
            minutes = None
            if cfg.generate_minutes:
                minutes = await self._step_minutes(meeting_id, transcription, context, result, cfg)
                result.completed_steps.append(PipelineStep.MINUTES_GENERATION)

            # Step 7: Trigger async RAG index
            self._trigger_rag_index(meeting_id)

            result.status = ProcessingStatus.completed

            # Persist: save everything to DB
            try:
                await repo.update_meeting_status(meeting_id, ProcessingStatus.completed)
                if result.transcription and result.transcription.lines:
                    await repo.save_transcript_lines(meeting_id, result.transcription.lines)
                if result.context:
                    await repo.save_action_items(meeting_id, result.context.action_items)
                    await repo.save_decisions(meeting_id, result.context.decisions)
                if result.minutes:
                    await repo.save_minutes(meeting_id, result.minutes.content, cfg.template_type)
            except Exception as persist_err:
                logger.warning(f"[pipeline] DB persist failed: {persist_err}")

        except Exception as e:
            logger.exception(f"[pipeline] fatal error meeting={meeting_id}")
            result.status = ProcessingStatus.failed
            result.error = str(e)
            try:
                await repo.update_meeting_status(meeting_id, ProcessingStatus.failed, str(e))
            except Exception:
                pass

        finally:
            self._cleanup(work_path, audio_path)

        return result

    # ----------------------------------------------------------------
    # Per-step implementations
    # ----------------------------------------------------------------

    async def _step_vad(self, audio_path: str, result: PipelineResult, cfg: PipelineConfig) -> str:
        """Step 1: Voice Activity Detection (Silero VAD)."""
        try:
            from app.services.audio_preprocessing import vad_service
            out_path = audio_path.replace(".wav", "_vad.wav")
            out = await vad_service.remove_silence(
                input_path=audio_path,
                output_path=out_path,
                threshold=settings.vad_threshold,
                min_speech_duration_ms=settings.vad_min_speech_duration_ms,
            )
            logger.info(f"[pipeline] VAD done: {audio_path} → {out}")
            return out
        except Exception as e:
            logger.warning(f"[pipeline] VAD skipped ({e})")
            return audio_path

    async def _step_noise_reduction(self, audio_path: str, result: PipelineResult, cfg: PipelineConfig) -> str:
        """Step 2: Noise Reduction (noisereduce / RNNoise)."""
        try:
            from app.services.audio_preprocessing import noise_reduction_service
            out_path = audio_path.replace(".wav", "_denoised.wav")
            out = noise_reduction_service.reduce_noise(
                audio_path=audio_path,
                output_path=out_path,
                prop_decrease=0.75,
                stationary=False,
            )
            logger.info(f"[pipeline] NR done: {audio_path} → {out}")
            return out
        except Exception as e:
            logger.warning(f"[pipeline] NR skipped ({e})")
            return audio_path

    async def _step_transcription(
        self, audio_path: str, meeting_id: str, result: PipelineResult, cfg: PipelineConfig
    ) -> Optional[TranscriptionResponse]:
        """Step 3: WhisperX transcription with word-level timestamps."""
        try:
            from app.services.whisperx_stt import WhisperXService
            svc = WhisperXService()

            class _MockFile:
                def __init__(self, path):
                    self.filename = os.path.basename(path)
                    self._path = path
                async def read(self):
                    with open(self._path, "rb") as f:
                        return f.read()

            resp = await svc.transcribe(
                file=_MockFile(audio_path),
                meeting_id=meeting_id,
                language=cfg.language,
                diarize=cfg.diarize,
            )
            result.transcription = resp
            logger.info(f"[pipeline] transcription done: {len(resp.lines or [])} lines")
            return resp
        except Exception as e:
            logger.error(f"[pipeline] transcription failed: {e}")
            result.error = f"transcription: {e}"
            return None

    async def _step_diarization(
        self, audio_path: str, result: PipelineResult, cfg: PipelineConfig
    ) -> Optional[DiarizationResponse]:
        """Step 4: Pyannote speaker diarization."""
        try:
            from app.services.diarization import DiarizationService
            svc = DiarizationService()

            class _MockFile:
                def __init__(self, path):
                    self.filename = os.path.basename(path)
                    self._path = path
                async def read(self):
                    with open(self._path, "rb") as f:
                        return f.read()

            resp = await svc.diarize(
                file=_MockFile(audio_path),
                num_speakers=cfg.num_speakers,
            )
            result.diarization = resp
            logger.info(f"[pipeline] diarization done: {resp.num_speakers} speakers")
            return resp
        except Exception as e:
            logger.warning(f"[pipeline] diarization skipped ({e})")
            return None

    async def _step_context(
        self, transcription: TranscriptionResponse, result: PipelineResult
    ) -> Optional[ContextResponse]:
        """Step 5-6: GovKB entity extraction + Context extraction."""
        try:
            from app.services.government_kb import GovernmentKBService
            from app.services.context_extractor import ContextExtractorService

            gov_svc = GovernmentKBService()
            ctx_svc = ContextExtractorService()

            full_text = " ".join([l.text for l in (transcription.lines or [])])

            # GovKB
            gov_req = type("Req", (), {"text": full_text})()
            gov_result = gov_svc.extract_entities(gov_req)
            logger.info(f"[pipeline] GovKB: {len(gov_result.entities)} entities")

            # Context
            ctx_req = type("Req", (), {"text": full_text})()
            ctx_result = ctx_svc.extract(ctx_req)
            result.context = ctx_result
            logger.info(f"[pipeline] context: {len(ctx_result.action_items)} actions, {len(ctx_result.decisions)} decisions")

            return ctx_result
        except Exception as e:
            logger.warning(f"[pipeline] context skipped ({e})")
            return None

    async def _step_minutes(
        self, meeting_id: str, transcription: TranscriptionResponse,
        context: Optional[ContextResponse], result: PipelineResult, cfg: PipelineConfig
    ) -> Optional[MinutesResponse]:
        """Step 7: Minutes generation from transcript + context."""
        try:
            from app.services.minutes_generator import MinutesGeneratorService
            from app.models.schemas import MinutesRequest

            svc = MinutesGeneratorService()
            req = MinutesRequest(
                meeting_id=meeting_id,
                template_type=cfg.template_type,
                title="Meeting",
                date="",
                location="",
                participants=[],
                transcript=transcription.lines or [],
                context=context,
            )
            resp = svc.generate(req)
            result.minutes = resp
            logger.info(f"[pipeline] minutes generated: template={cfg.template_type}")
            return resp
        except Exception as e:
            logger.warning(f"[pipeline] minutes skipped ({e})")
            return None

    def _trigger_rag_index(self, meeting_id: str):
        """Step 8: Async RAG indexing via Celery."""
        try:
            from app.celery_app import celery_app
            celery_app.send_task("app.tasks.rag.index_meeting_for_rag", args=[meeting_id])
            logger.info(f"[pipeline] RAG index triggered for {meeting_id}")
        except Exception as e:
            logger.warning(f"[pipeline] RAG trigger failed ({e})")

    # ----------------------------------------------------------------
    # Helpers
    # ----------------------------------------------------------------

    def _prepare_audio(self, audio_path: str) -> str:
        """Ensure audio is WAV 16kHz mono for processing."""
        try:
            import soundfile as sf
            import numpy as np

            data, sr = sf.read(audio_path)
            out = audio_path
            if sr != 16000 or (len(data.shape) > 1 and data.shape[1] > 1):
                import torchaudio.transforms as T
                import torch

                if len(data.shape) > 1 and data.shape[1] > 1:
                    data = np.mean(data, axis=1)
                out = audio_path.replace(".wav", "_16k.wav")
                sf.write(out, data, 16000)
            return out
        except Exception as e:
            raise RuntimeError(f"Failed to prepare audio: {e}") from e

    def _cleanup(self, work_path: str, original_path: str):
        """Remove temporary working files."""
        base = os.path.splitext(work_path)[0]
        for suffix in ["_vad.wav", "_denoised.wav", "_16k.wav"]:
            tmp = base.rsplit("_", 1)[0] + suffix if "_" in base else base + suffix
            if tmp != original_path and os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except OSError:
                    pass


# Singleton
pipeline = PipelineOrchestrator()
