"""Celery task unit tests — no broker needed, tasks called directly."""

import os
import json
import tempfile
from unittest.mock import patch, MagicMock, AsyncMock
from pathlib import Path

import pytest

# Force Celery eager mode before any import
os.environ.setdefault("CELERY_BROKER_URL", "memory://")
os.environ.setdefault("CELERY_RESULT_BACKEND", "cache+memory://")
os.environ.setdefault("CELERY_TASK_ALWAYS_EAGER", "true")


# ── helpers ──────────────────────────────────────────────────────────────────

def call_task(task_func, *args, **kwargs):
    """Call a bind=True Celery task via __wrapped__, skipping Celery injection."""
    # __wrapped__ is the raw function without Celery's 'self' injection
    return task_func.__wrapped__(*args, **kwargs)


# ── transcription tasks ──────────────────────────────────────────────────────

class TestTranscribeAudio:
    """transcribe_audio task."""

    @patch("app.services.whisperx_stt.WhisperXService")
    @patch("app.tasks.diarization.diarize_audio")
    def test_success(self, MockDiarize, MockWhisper):
        from app.tasks.transcription import transcribe_audio

        mock_svc = MockWhisper.return_value
        mock_svc.transcribe = AsyncMock()
        mock_svc.transcribe.return_value = MagicMock(
            status=MagicMock(value="completed"),
            error=None,
            duration_ms=120000,
            lines=[
                MagicMock(model_dump=lambda: {"text": "Halo", "timestamp_ms": 1000}),
            ],
        )

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(b"fake audio")
            tmp = f.name
        try:
            result = call_task(transcribe_audio, "m1", tmp, "id")
            assert result["status"] == "completed"
            assert result["meeting_id"] == "m1"
            assert len(result["lines"]) == 1
            assert result["duration_ms"] == 120000
        finally:
            os.unlink(tmp)

    @patch("app.services.whisperx_stt.WhisperXService")
    def test_transcription_fails(self, MockWhisper):
        from app.tasks.transcription import transcribe_audio

        mock_svc = MockWhisper.return_value
        mock_svc.transcribe = AsyncMock()
        mock_svc.transcribe.return_value = MagicMock(
            status=MagicMock(value="failed"),
            error="No speech detected",
        )

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(b"silence")
            tmp = f.name
        try:
            with pytest.raises(RuntimeError, match="Transcription failed"):
                call_task(transcribe_audio, "m1", tmp, "id")
        finally:
            os.unlink(tmp)


class TestTranscribeBatch:
    """transcribe_batch task."""

    @patch("app.tasks.transcription.transcribe_audio.s")
    @patch("os.path.exists")
    def test_batch_with_files(self, mock_exists, mock_s):
        from app.tasks.transcription import transcribe_batch

        # transcribe_audio.s returns a celery Signature-like object
        mock_sig = MagicMock()
        mock_sig.id = "mock-task-id"
        mock_s.return_value = mock_sig

        mock_exists.return_value = True

        # Mock group to avoid Celery internals
        with patch("app.tasks.transcription.group") as mock_group:
            mock_group.return_value = MagicMock()
            result = call_task(transcribe_batch, ["m1", "m2"], "/tmp/audio")

        assert result is not None
        assert mock_s.call_count == 2
        mock_group.assert_called_once()

    @patch("os.path.exists")
    def test_batch_no_files(self, mock_exists):
        from app.tasks.transcription import transcribe_batch

        mock_exists.return_value = False

        result = call_task(transcribe_batch, ["m1"], "/tmp/nope")
        assert result == {"status": "no_files_found"}


class TestCreateTranscriptionPipeline:
    """create_transcription_pipeline — pure chain builder."""

    def test_chain_returns_chain(self):
        from app.tasks.transcription import create_transcription_pipeline
        chain = create_transcription_pipeline("m1", "/audio/test.wav")
        assert chain is not None
        assert len(chain.tasks) == 5


# ── diarization tasks ────────────────────────────────────────────────────────

class TestDiarizeAudio:
    """diarize_audio task."""

    @patch("app.services.diarization.DiarizationService")
    @patch("app.tasks.nlp.process_transcript_nlp")
    def test_success(self, MockNLP, MockDiar):
        from app.tasks.diarization import diarize_audio

        mock_svc = MockDiar.return_value
        mock_svc.diarize = AsyncMock()
        mock_svc.diarize.return_value = MagicMock(
            num_speakers=2,
            segments=[
                MagicMock(speaker_id="SPK1", speaker_name="Alice", start_ms=0, end_ms=5000, confidence=0.95),
            ],
        )

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(b"fake")
            tmp = f.name
        try:
            result = call_task(diarize_audio, "m1", tmp, None)
            assert result["status"] == "completed"
            assert result["num_speakers"] == 2
            assert len(result["segments"]) == 1
            MockNLP.delay.assert_called_once_with(meeting_id="m1")
        finally:
            os.unlink(tmp)


class TestMergeTranscriptionDiarization:
    """merge_transcription_diarization — pure logic."""

    def test_merge_aligns_speakers(self):
        from app.tasks.diarization import merge_transcription_diarization

        t_result = {
            "lines": [
                {"text": "Hello", "timestamp_ms": 1000},
                {"text": "World", "timestamp_ms": 3000},
            ]
        }
        d_result = {
            "segments": [
                {"speaker_id": "SPK1", "speaker_name": "Alice", "start_ms": 0, "end_ms": 2000, "confidence": 0.95},
                {"speaker_id": "SPK2", "speaker_name": "Bob", "start_ms": 2001, "end_ms": 5000, "confidence": 0.9},
            ]
        }

        result = call_task(merge_transcription_diarization, "m1", t_result, d_result)
        assert result["status"] == "merged"
        assert result["lines"][0]["speaker"] == "Alice"
        assert result["lines"][1]["speaker"] == "Bob"

    def test_merge_unknown_speaker(self):
        from app.tasks.diarization import merge_transcription_diarization

        t_result = {"lines": [{"text": "Hi", "timestamp_ms": 9999}]}
        d_result = {"segments": [{"speaker_id": "SPK1", "speaker_name": "A", "start_ms": 0, "end_ms": 100, "confidence": 0.9}]}

        result = call_task(merge_transcription_diarization, "m1", t_result, d_result)
        assert result["lines"][0]["speaker"] == "Unknown"


# ── NLP task ─────────────────────────────────────────────────────────────────

class TestProcessTranscriptNLP:
    """process_transcript_nlp task."""

    @patch("app.services.indonesian_nlp.IndonesianNLPService")
    @patch("app.services.government_kb.GovernmentKBService")
    @patch("app.services.context_extractor.ContextExtractorService")
    @patch("app.tasks.minutes.generate_minutes")
    def test_success(self, MockGen, MockCtx, MockGovKB, MockNLP):
        from app.tasks.nlp import process_transcript_nlp

        result = call_task(process_transcript_nlp, "m1")
        assert result["status"] == "completed"
        assert result["nlp_normalized"] is True
        MockGen.delay.assert_called_once_with(meeting_id="m1", template_type="government")


# ── minutes tasks ────────────────────────────────────────────────────────────

class TestGenerateMinutes:
    """generate_minutes task."""

    @patch("app.services.minutes_generator.MinutesGeneratorService")
    @patch("app.tasks.rag.index_meeting_for_rag")
    def test_success(self, MockRag, MockMin):
        from app.tasks.minutes import generate_minutes

        mock_svc = MockMin.return_value
        mock_svc.generate.return_value = MagicMock(
            status=MagicMock(value="completed"),
            content={"title": "Notulen Rapat"},
        )

        result = call_task(generate_minutes, "m1", "government")
        assert result["status"] == "completed"
        assert result["content"]["title"] == "Notulen Rapat"
        MockRag.delay.assert_called_once_with(meeting_id="m1")

    @patch("app.services.minutes_generator.MinutesGeneratorService")
    def test_failure(self, MockMin):
        from app.tasks.minutes import generate_minutes

        mock_svc = MockMin.return_value
        mock_svc.generate.return_value = MagicMock(
            status=MagicMock(value="failed"),
            error="Template not found",
        )

        with pytest.raises(RuntimeError, match="Minutes generation failed"):
            call_task(generate_minutes, "m1", "government")

    @patch("app.tasks.minutes.generate_minutes")
    def test_regenerate_delegates(self, MockGen):
        from app.tasks.minutes import regenerate_minutes

        MockGen.return_value = {"status": "completed"}
        result = call_task(regenerate_minutes, "m1")
        assert result["status"] == "completed"
        MockGen.assert_called_once_with("m1", "government")


# ── RAG tasks ────────────────────────────────────────────────────────────────

class TestRAGTasks:
    """index_meeting_for_rag + delete_meeting_index."""

    def test_index(self):
        from app.tasks.rag import index_meeting_for_rag
        result = call_task(index_meeting_for_rag, "m1")
        assert result["status"] == "completed"

    @patch("app.services.rag_engine.RAGEngineService")
    def test_delete_index(self, MockRAG):
        from app.tasks.rag import delete_meeting_index

        MockRAG.return_value.delete_index.return_value = {"deleted": True}
        result = call_task(delete_meeting_index, "m1")
        assert result["deleted"] is True


# ── export task ──────────────────────────────────────────────────────────────

class TestExportMeeting:
    """export_meeting task."""

    def test_success_docx(self):
        from app.tasks.export import export_meeting
        result = call_task(export_meeting, "m1", "docx")
        assert result["status"] == "completed"
        assert result["format"] == "docx"

    def test_unsupported_format(self):
        from app.tasks.export import export_meeting
        with pytest.raises(ValueError, match="Unsupported format"):
            call_task(export_meeting, "m1", "xls")


# ── maintenance tasks ────────────────────────────────────────────────────────

class TestMaintenanceTasks:
    """cleanup_old_results + cleanup_temp_files."""

    def test_cleanup_results(self):
        from app.tasks.maintenance import cleanup_old_results

        with patch("app.celery_app.celery_app") as mock_celery:
            mock_backend = MagicMock()
            mock_celery.backend = mock_backend

            result = call_task(cleanup_old_results)

        assert result["status"] == "ok"
        mock_backend.cleanup.assert_called_once()

    def test_cleanup_temp_files_nonexistent_dir(self):
        from app.tasks.maintenance import cleanup_temp_files, TEMP_DIRS

        original = TEMP_DIRS[:]
        TEMP_DIRS.clear()
        TEMP_DIRS.append("/tmp/nonexistent_xyz_cleanup_test")
        try:
            result = call_task(cleanup_temp_files)
            assert result["status"] == "ok"
            assert result["files_removed"] == 0
        finally:
            TEMP_DIRS.clear()
            TEMP_DIRS.extend(original)

    def test_cleanup_temp_files_removes_old(self):
        from app.tasks.maintenance import cleanup_temp_files, TEMP_DIRS

        with tempfile.TemporaryDirectory() as td:
            old_file = Path(td) / "old.wav"
            old_file.write_text("stale")
            import time
            old_mtime = time.time() - 48 * 3600
            os.utime(str(old_file), (old_mtime, old_mtime))

            new_file = Path(td) / "new.wav"
            new_file.write_text("fresh")

            original = TEMP_DIRS[:]
            TEMP_DIRS.clear()
            TEMP_DIRS.append(td)
            try:
                result = call_task(cleanup_temp_files)
                assert result["status"] == "ok"
                assert result["files_removed"] == 1
                assert not old_file.exists()
                assert new_file.exists()
            finally:
                TEMP_DIRS.clear()
                TEMP_DIRS.extend(original)
