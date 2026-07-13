# Prompts — Phase 13 AI Pipeline

## Implementasi AI Pipeline
```
Bantu implementasi AI pipeline untuk transkripsi dan notulen.

Pipeline flow:
Audio Input → VAD (Silero) → Noise Reduction → Split → 
WhisperX (transcribe + align) → Pyannote (diarize) → 
Government Dictionary (post-process) → Context Engine → 
Minutes AI (LLM generate) → Store

Teknologi:
- WhisperX untuk speech-to-text
- Pyannote untuk speaker diarization
- Silero VAD untuk voice activity
- LLM (GPT-4o / Llama) untuk notulen
- Sentence Transformers untuk embedding
- Chroma/Qdrant untuk vector store

Buat Python pipeline modular dengan Redis queue.
```
