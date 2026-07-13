"""
Test Script for AI Pipeline
Run this to verify all components are working
"""
import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'services', 'ai-service'))

from app.config import settings
from app.services.whisperx_stt import whisperx_service
from app.services.silero_vad import silero_vad
from app.services.noise_reduction import noise_reduction
from app.skills.gov_dictionary.extractor import gov_dictionary_extractor
from app.skills.context_engine.extractor import context_engine


async def test_whisperx():
    """Test WhisperX service initialization"""
    print("Testing WhisperX service...")
    print(f"  Model loaded: {whisperx_service.model is not None}")
    print(f"  Device: {settings.whisper_device}")
    print(f"  Model size: {settings.whisper_model_size}")
    return True


async def test_vad():
    """Test Silero VAD service"""
    print("Testing Silero VAD...")
    print(f"  Model loaded: {silero_vad.model is not None}")
    print(f"  Sample rate: {silero_vad.sample_rate}")
    return True


async def test_noise_reduction():
    """Test Noise Reduction service"""
    print("Testing Noise Reduction...")
    print(f"  noisereduce available: {noise_reduction.has_noisereduce}")
    print(f"  rnnoise available: {noise_reduction.has_rnnoise}")
    return True


async def test_gov_dictionary():
    """Test Government Dictionary extractor"""
    print("Testing Government Dictionary...")
    
    test_text = """
    Rapat DPRD membahas APBD 2025 sebesar 5 triliun rupiah. 
    Bupati dan Sekda hadir. Kementerian Dalam Negeri mengeluarkan Permendagri baru.
    Realisasi anggaran sudah mencapai 72 persen.
    """
    
    entities = gov_dictionary_extractor.extract(test_text)
    print(f"  Found {len(entities)} entities:")
    for e in entities[:5]:
        print(f"    {e.category}: {e.text} -> {e.normalized_text} ({e.confidence})")
    
    print(f"  Categories: {gov_dictionary_extractor.get_categories()}")
    return True


async def test_context_engine():
    """Test Context Engine"""
    print("Testing Context Engine...")
    
    test_text = """
    Pak Bupati: Kita harus menyelesaikan proyek jalan ini sebelum akhir bulan.
    Ibu Sekda: Saya akan koordinasi dengan Dinas PU untuk mempercepat proses tender.
    Pak Kepala Dinas: Saya bertanggung jawab memastikan dokumen lengkap sebelum akhir pekan.
    Keputusan: Proyek disetujui dengan anggaran 50 miliar.
    """
    
    result = context_engine.analyze(test_text)
    print(f"  Action items: {len(result.action_items)}")
    print(f"  Decisions: {len(result.decisions)}")
    print(f"  Votes: {len(result.votes)}")
    print(f"  Interruptions: {len(result.interruptions)}")
    print(f"  Deadlines: {len(result.deadlines)}")
    
    for ai in result.action_items:
        print(f"  Action: {ai.description[:60]}... (PIC: {ai.pic}, Priority: {ai.priority})")
    
    for d in result.decisions:
        print(f"  Decision: {d.description[:60]}... (Category: {d.category})")
    
    return True


async def test_9router():
    """Test 9router connectivity"""
    print("Testing 9router...")
    
    if not settings.nine_router_key:
        print("  Skipping: 9router key not configured")
        return True
    
    import httpx
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Health check
        resp = await client.get(f"{settings.nine_router_base}/health")
        print(f"  Health: {resp.status_code}")
        
        # Models list
        resp = await client.get(f"{settings.nine_router_base}/models")
        if resp.status_code == 200:
            data = resp.json()
            models = [m['id'] for m in data.get('data', []) if 'kr/' in m['id'] or 'auto' in m['id']]
            print(f"  Models: {len(models)} Kiro/combo models")
            for m in models[:5]:
                print(f"    {m}")
        
        # Test chat completion
        resp = await client.post(
            f"{settings.nine_router_base}/chat/completions",
            headers={"Authorization": f"Bearer {settings.nine_router_key}"},
            json={
                "model": "kr/claude-sonnet-4.5",
                "messages": [{"role": "user", "content": "Reply: 9router OK"}],
                "max_tokens": 10,
                "stream": False,
            }
        )
        if resp.status_code == 200:
            content = resp.json()['choices'][0]['message']['content']
            print(f"  Chat: {content.strip()}")
        elif resp.status_code == 401:
            print("  Auth failed: Check 9router key")
        
    return True


async def main():
    print("=" * 60)
    print("Risalah AI Pipeline - Component Tests")
    print("=" * 60)
    
    tests = [
        ("WhisperX", test_whisperx),
        ("Silero VAD", test_vad),
        ("Noise Reduction", test_noise_reduction),
        ("Government Dictionary", test_gov_dictionary),
        ("Context Engine", test_context_engine),
        ("9router", test_9router),
    ]
    
    results = {}
    for name, test_fn in tests:
        try:
            print(f"\n>>> {name}")
            await test_fn()
            results[name] = "PASS"
        except Exception as e:
            print(f"  FAIL: {e}")
            results[name] = f"FAIL: {e}"
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for name, status in results.items():
        icon = "✅" if status == "PASS" else "❌"
        print(f"  {icon} {name}: {status}")
    
    all_pass = all(s == "PASS" for s in results.values())
    print(f"\n{'All tests passed!' if all_pass else 'Some tests failed!'}")
    return all_pass


if __name__ == "__main__":
    asyncio.run(main())