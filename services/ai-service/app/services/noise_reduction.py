"""
Noise Reduction Service - RNNoise / noisereduce
"""
import os
import tempfile
import asyncio
import logging
import numpy as np
from typing import Optional
from fastapi import UploadFile
from app.config import settings
from app.models.schemas import ProcessingStatus

logger = logging.getLogger(__name__)


class NoiseReductionService:
    """
    Noise Reduction Service using noisereduce library
    
    Features:
    - Spectral gating noise reduction
    - Stationary/non-stationary noise reduction
    - Configurable aggressiveness
    - Batch processing support
    """
    
    def __init__(self):
        self._check_dependencies()
    
    def _check_dependencies(self):
        """Check available noise reduction libraries"""
        self.has_noisereduce = False
        self.has_rnnoise = False
        
        try:
            import noisereduce as nr
            self.has_noisereduce = True
            logger.info("noisereduce available")
        except ImportError:
            pass
        
        try:
            import rnnoise
            self.has_rnnoise = True
            logger.info("rnnoise available")
        except ImportError:
            pass
        
        if not self.has_noisereduce and not self.has_rnnoise:
            logger.warning("No noise reduction libraries available. Install: pip install noisereduce rnnoise")
    
    async def reduce_noise(
        self,
        file: UploadFile,
        stationary: bool = True,
        prop_decrease: float = 0.75,
        n_fft: int = 2048,
        win_length: int = 2048,
        hop_length: int = 512,
    ) -> str:
        """
        Reduce noise in uploaded audio file.
        
        Returns path to processed audio file.
        """
        suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        output_path = tmp_path.replace(suffix, f"_denoised{suffix}")
        
        try:
            await self._process_denoise(
                tmp_path, output_path, 
                stationary=stationary,
                prop_decrease=prop_decrease,
                n_fft=n_fft,
                win_length=win_length,
                hop_length=hop_length,
            )
            return output_path
        except Exception as e:
            logger.error("Denoise error: %s", e)
            return tmp_path  # Return original on failure
        finally:
            if os.path.exists(tmp_path) and tmp_path != output_path:
                os.unlink(tmp_path)
    
    async def _process_denoise(
        self,
        input_path: str,
        output_path: str,
        stationary: bool = True,
        prop_decrease: float = 0.75,
        n_fft: int = 2048,
        win_length: int = 2048,
        hop_length: int = 512,
    ):
        """Process noise reduction"""
        def _denoise():
            import soundfile as sf
            
            # Load audio
            audio, sr = sf.read(input_path)
            
            # Handle stereo
            if audio.ndim == 2:
                # Process each channel
                denoised_channels = []
                for ch in range(audio.shape[1]):
                    denoised = self._reduce_noise_channel(
                        audio[:, ch], sr, stationary, prop_decrease, n_fft, win_length, hop_length
                    )
                    denoised_channels.append(denoised)
                denoised = np.column_stack(denoised_channels)
            else:
                denoised = self._reduce_noise_channel(audio, sr, stationary, prop_decrease, n_fft, win_length, hop_length)
            
            # Save
            sf.write(output_path, denoised, sr)
        
        await asyncio.get_event_loop().run_in_executor(None, _denoise)
    
    def _reduce_noise_channel(
        self,
        audio: np.ndarray,
        sr: int,
        stationary: bool,
        prop_decrease: float,
        n_fft: int,
        win_length: int,
        hop_length: int,
    ) -> np.ndarray:
        """Reduce noise in single channel"""
        if self.has_noisereduce:
            import noisereduce as nr
            
            # Estimate noise from first 0.5 seconds if stationary
            if stationary and len(audio) > sr // 2:
                noise_sample = audio[:sr // 2]
                return nr.reduce_noise(
                    y=audio,
                    sr=sr,
                    y_noise=noise_sample,
                    stationary=stationary,
                    prop_decrease=prop_decrease,
                    n_fft=n_fft,
                    win_length=win_length,
                    hop_length=hop_length,
                )
            else:
                return nr.reduce_noise(
                    y=audio,
                    sr=sr,
                    stationary=stationary,
                    prop_decrease=prop_decrease,
                    n_fft=n_fft,
                    win_length=win_length,
                    hop_length=hop_length,
                )
        
        elif self.has_rnnoise:
            import rnnoise
            denoiser = rnnoise.create_denoiser()
            # rnnoise expects 16kHz mono
            if sr != 16000:
                import torchaudio.transforms as T
                import torch
                resampler = T.Resample(sr, 16000)
                audio_16k = resampler(torch.from_numpy(audio).float().unsqueeze(0)).squeeze(0).numpy()
            else:
                audio_16k = audio
            
            denoised_16k = denoiser.denoise(audio_16k)
            
            # Resample back if needed
            if sr != 16000:
                resampler = T.Resample(16000, sr)
                denoised = resampler(torch.from_numpy(denoised_16k).float().unsqueeze(0)).squeeze(0).numpy()
            else:
                denoised = denoised_16k
            
            return denoised
        
        else:
            # No denoising available, return original
            return audio
    
    async def reduce_noise_batch(
        self,
        input_dir: str,
        output_dir: str,
        stationary: bool = True,
        prop_decrease: float = 0.75,
    ) -> int:
        """Batch process directory of audio files"""
        os.makedirs(output_dir, exist_ok=True)
        
        processed = 0
        for filename in os.listdir(input_dir):
            if filename.lower().endswith(('.wav', '.mp3', '.flac', '.m4a')):
                input_path = os.path.join(input_dir, filename)
                output_path = os.path.join(output_dir, filename)
                
                try:
                    await self._process_denoise(input_path, output_path, stationary, prop_decrease)
                    processed += 1
                except Exception as e:
                    logger.warning("Failed to denoise %s: %s", filename, e)
        
        return processed


# Export instance
noise_reduction = NoiseReductionService()