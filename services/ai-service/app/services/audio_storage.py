"""
Audio Storage — persistent file management for uploaded audio.
Resamples to 16kHz mono WAV, stores permanently.
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional

from app.config import settings


class AudioStorage:
    """
    Persistent audio file storage.

    - Saves uploads to config.audio_storage_path
    - Resamples to 16kHz mono WAV
    - Returns stable file paths
    - Handles cleanup
    """

    def __init__(self):
        raw = settings.audio_storage_path
        # Fallback if /data not writable
        if raw.startswith("/data") and not os.access("/data", os.W_OK):
            raw = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "audio")
        self.base_path = Path(raw)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save_upload(self, file_content: bytes, filename: str) -> str:
        """Save uploaded file, return stable path."""
        meeting_dir = self.base_path / uuid.uuid4().hex[:8]
        meeting_dir.mkdir(parents=True, exist_ok=True)

        ext = os.path.splitext(filename)[1] or ".wav"
        raw_path = str(meeting_dir / f"original{ext}")

        with open(raw_path, "wb") as f:
            f.write(file_content)

        return self._ensure_wav(raw_path, str(meeting_dir / "audio_16k.wav"))

    def _ensure_wav(self, input_path: str, output_path: str) -> str:
        """Convert to 16kHz mono WAV if needed."""
        try:
            import soundfile as sf
            import numpy as np

            data, sr = sf.read(input_path)
            needs_resample = sr != 16000
            needs_mono = len(data.shape) > 1 and data.shape[1] > 1

            if needs_mono:
                data = np.mean(data, axis=1)

            if needs_resample or needs_mono:
                import torchaudio.transforms as T
                import torch

                tensor = torch.from_numpy(data).float()
                if needs_resample:
                    resampler = T.Resample(sr, 16000)
                    tensor = resampler(tensor.unsqueeze(0)).squeeze(0)
                sf.write(output_path, tensor.numpy(), 16000)
                os.unlink(input_path)
                return output_path
            else:
                shutil.move(input_path, output_path)
                return output_path
        except Exception as e:
            raise RuntimeError(f"Audio conversion failed: {e}")

    def delete_audio(self, audio_path: str):
        """Remove audio file and parent dir."""
        path = Path(audio_path)
        if path.exists():
            path.unlink()
        parent = path.parent
        if parent.exists() and not any(parent.iterdir()):
            parent.rmdir()

    def get_audio_path(self, meeting_id: str) -> Optional[str]:
        """Find audio for meeting."""
        for entry in self.base_path.iterdir():
            if entry.is_dir():
                wav = entry / "audio_16k.wav"
                if wav.exists():
                    return str(wav)
        return None

    def get_duration_ms(self, audio_path: str) -> int:
        """Get audio duration in ms."""
        try:
            import soundfile as sf
            info = sf.info(audio_path)
            return int(info.frames / info.samplerate * 1000)
        except Exception:
            return 0


audio_storage = AudioStorage()
