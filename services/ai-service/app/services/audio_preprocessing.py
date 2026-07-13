"""
Audio Preprocessing Facade — delegates to SileroVADService + NoiseReductionService.

Usage:
    from app.services.audio_preprocessing import vad_service, noise_reduction_service
    out_path = await vad_service.remove_silence(input_path, output_path)
    out_path = noise_reduction_service.reduce_noise(input_path, output_path)
"""
import asyncio
import logging
from app.services.silero_vad import SileroVADService, VADSegment
from app.services.noise_reduction import NoiseReductionService as NRService

logger = logging.getLogger(__name__)

class VADService:
    """Facade wrapping SileroVADService — silence removal."""

    def __init__(self):
        self._inner = SileroVADService()

    async def remove_silence(
        self,
        input_path: str,
        output_path: str,
        threshold: float = 0.5,
        min_speech_duration_ms: int = 250,
    ) -> str:
        """Remove silence from audio file. Returns output_path."""
        try:
            segments = await self._inner._process_vad(
                input_path, threshold, min_speech_duration_ms, 100
            )
            if not segments:
                return input_path

            import soundfile as sf
            import numpy as np

            data, sr = sf.read(input_path)
            if sr != 16000:
                import torchaudio.transforms as T
                import torch
                resampler = T.Resample(sr, 16000)
                data = resampler(torch.from_numpy(data).float().unsqueeze(0)).squeeze(0).numpy()
                sr = 16000

            speech_parts = []
            for seg in segments:
                start = int(seg.start_ms / 1000 * sr)
                end = int(seg.end_ms / 1000 * sr)
                if start < len(data) and end <= len(data):
                    speech_parts.append(data[start:end])

            if speech_parts:
                result = np.concatenate(speech_parts)
                sf.write(output_path, result, sr)
                return output_path
            return input_path
        except Exception as e:
            logger.error("VAD facade error: %s", e)
            return input_path


class NoiseReductionService:
    """Facade wrapping noisereduce — spectral gating."""

    def __init__(self):
        self._inner = NRService()

    def reduce_noise(
        self,
        audio_path: str,
        output_path: str,
        prop_decrease: float = 0.75,
        stationary: bool = False,
    ) -> str:
        """Reduce noise. Returns output_path."""
        try:
            import noisereduce as nr
            import soundfile as sf
            import numpy as np

            data, sr = sf.read(audio_path)
            if data.ndim == 2:
                channels = []
                for ch in range(data.shape[1]):
                    denoised = nr.reduce_noise(
                        y=data[:, ch], sr=sr,
                        stationary=stationary, prop_decrease=prop_decrease,
                    )
                    channels.append(denoised)
                denoised = np.column_stack(channels)
            else:
                denoised = nr.reduce_noise(
                    y=data, sr=sr,
                    stationary=stationary, prop_decrease=prop_decrease,
                )
            sf.write(output_path, denoised, sr)
            return output_path
        except Exception as e:
            logger.error("NR facade error: %s", e)
            return audio_path


# Module-level singletons (same API as before)
vad_service = VADService()
noise_reduction_service = NoiseReductionService()
