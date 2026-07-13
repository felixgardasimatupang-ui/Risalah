# Risalah SEKNEG AI — Project Execution Plan

## Executive Summary
Sistem manajemen rapat & notulen AI untuk pemerintah Indonesia. Pipeline AI Phase 13 adalah core deliverable: Whisper → WhisperX → Pyannote → VAD → Noise Reduction → Gov Dictionary → Context Engine → Minutes AI → Semantic Search → RAG → AI Chat.

---

## Current State Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| **DB Schema (Prisma)** | ✅ Complete | 30+ models, multi-tenant, PGVector ready |
| **Next.js Frontend** | ✅ Scaffolded | App Router, components, hooks, stores |
| **AI Service (FastAPI)** | ⚠️ 60% Complete | Whisper, Diarization, NLP, GovKB, Minutes, RAG implemented; missing: WhisperX, VAD, Noise Reduction, Context Engine, Celery pipeline |
| **9router** | ✅ Operational | 5 providers, 45+ models, 5 combos |
| **OpenCode Agents** | ✅ Configured | 5 agents with model routing |
| **Skills** | ✅ Installed | 10+ skills available |

---

## Phase 13 AI Pipeline — Task Mapping to Agents & Skills

### Sprint 9: Whisper Pipeline (Current Sprint Target)

| Task ID | Task | Agent | Skills to Use | Dependencies |
|---------|------|-------|---------------|--------------|
| AI-001 | Integrasi Whisper | **build** | mcp-builder, webapp-testing | Config, Docker GPU |
| AI-002 | Integrasi WhisperX | **build** | mcp-builder, webapp-testing | AI-001 |
| AI-003 | Integrasi Pyannote | **build** | mcp-builder, webapp-testing | AI-001, HF token |
| AI-004 | Implementasi VAD | **build** | mcp-builder | Silero VAD |
| AI-005 | Implementasi Noise Reduction | **build** | mcp-builder | RNNoise/noisereduce |
| AI-006 | Buat Government Dictionary | **plan** | skill-creator, grill-me | Existing KB in `government_kb.py` |
| AI-007 | Buat Context Engine | **plan** | skill-creator, grill-me | AI-001 to AI-005 |
| AI-008 | Implementasi Minutes AI | **build** | grill-me, skill-creator | Templates exist, LLM client ready |
| AI-009 | Implementasi Semantic Search | **build** | mcp-builder, webapp-testing | Embeddings, Chroma ready |
| AI-010 | Implementasi RAG | **build** | mcp-builder, composio | RAG engine exists, needs Celery |
| AI-011 | Implementasi AI Chat | **build** | webapp-testing, grill-me | RAG done, chat router exists |

---

## Agent Assignment Strategy

### `build` Agent (Primary Implementer)
- **Model**: `kr-coding` (Claude Sonnet 4.5 → Kiro auto)
- **Skills**: mcp-builder, webapp-testing, grill-me, skill-creator
- **Tasks**: All implementation (AI-001 to AI-011)
- **Why**: Most powerful model, unlimited free via Kiro, excellent for coding

### `plan` Agent (Architecture & Design)
- **Model**: `kr/deepseek-3.2` (DeepSeek via Kiro)
- **Skills**: grill-me, skill-creator
- **Tasks**: AI-006 (Gov Dictionary design), AI-007 (Context Engine architecture), reviewing plans
- **Why**: Strong reasoning, good for architectural decisions

### `explore` Agent (Codebase Analysis)
- **Model**: `openrouter/qwen/qwen3-30b-a3b` (MoE, efficient)
- **Skills**: understand-anything
- **Tasks**: Understanding existing code, finding patterns, PR reviews
- **Why**: Efficient for large context exploration

### `general` Agent (Support)
- **Model**: `auto-kr` (OpenRouter Qwen 32B → Kiro fallback)
- **Skills**: handoff, stop-slop
- **Tasks**: Documentation, handoff docs, writing tasks
- **Why**: Balanced, good for prose

### `billing` Agent (Admin/Fallback)
- **Model**: `kilo/stepfun/step-3.7-flash:free`
- **Tasks**: Low-priority, fallback
- **Why**: Free, limited capacity

---

## Skill Usage per Task

| Skill | When to Use | Tasks |
|-------|-------------|-------|
| **mcp-builder** | Building MCP servers for AI components | AI-001 to AI-005 (Whisper, Pyannote, VAD as MCP tools) |
| **webapp-testing** | Testing API endpoints, Playwright E2E | All AI tasks after implementation |
| **grill-me** | Pressure-test plans before coding | AI-006, AI-007, AI-008, AI-010, AI-011 |
| **skill-creator** | Create reusable skills for repeated patterns | AI-006 (GovDict skill), AI-007 (ContextEngine skill) |
| **composio** | Integrate GitHub/Linear for task tracking | All tasks |
| **understand-anything** | Codebase exploration, impact analysis | Before any implementation |
| **caveman** | Token-efficient communication | During long sessions |
| **stop-slop** | Clean documentation | Writing docs, PR descriptions |
| **handoff** | Session continuity | Long-running tasks across sessions |

---

## Detailed Implementation Sequence

### Week 1: Core Pipeline Foundation (Sprint 9)

#### Day 1-2: Whisper + WhisperX Implementation (AI-001, AI-002)
```bash
# build agent with mcp-builder + webapp-testing
1. Upgrade faster-whisper to use WhisperX for word-level timestamps
2. Implement audio chunking for long files
3. Add language detection (auto-detect Indonesian)
4. Create MCP server wrapper for transcription
5. Tests: unit + integration (webapp-testing)
```
**Deliverable**: `app/services/whisperx_stt.py` + MCP server

#### Day 3: Pyannote Diarization (AI-003)
```bash
1. Configure HF token in .env
2. Implement speaker embedding extraction
3. Merge with WhisperX output (speaker assignment)
4. Handle overlapping speech
4. MCP server for diarization
```
**Deliverable**: Enhanced `app/services/diarization.py` + MCP

#### Day 4: VAD + Noise Reduction (AI-004, AI-005)
```bash
1. Integrate Silero VAD (pre-filter silence)
2. Add RNNoise/noisereduce pre-processing
3. Pipeline: Audio → VAD → NoiseReduction → WhisperX → Pyannote
4. Benchmark on Indonesian audio samples
```
**Deliverable**: `app/services/audio_preprocessor.py`

#### Day 5: Government Dictionary Enhancement (AI-006)
```bash
# plan agent with grill-me + skill-creator
1. Grill-me the current KB design (plan agent)
2. Expand terms from official sources (KBBI, Peraturan)
3. Add fuzzy matching for speech recognition errors
4. Create GovDict skill for reuse
```
**Deliverable**: Enhanced `government_kb.py` + `gov-dictionary` skill

---

### Week 2: Context Engine & Minutes AI (Sprint 10-11)

#### Day 6-7: Context Engine (AI-007)
```bash
# plan agent with grill-me + skill-creator
1. Design context extraction from transcript + summary
2. Identify: key topics, decisions, action items, speakers
3. Create ContextEngine skill
4. Output structured context for Minutes AI + RAG
```
**Deliverable**: `app/services/context_engine.py` + skill

#### Day 8-9: Minutes AI Enhancement (AI-008)
```bash
# build agent with grill-me
1. Grill-me current template approach (plan agent)
2. Add LLM-based content generation (not just template fill)
3. Integrate with Government KB for term correction
4. Support streaming generation for long meetings
5. Test all 7 templates
```
**Deliverable**: Enhanced `minutes_generator.py` with LLM generation

---

### Week 3: Semantic Search, RAG & AI Chat (Sprint 12-13)

#### Day 10-11: Semantic Search (AI-009)
```bash
# build agent with mcp-builder + webapp-testing
1. Optimize embedding model (BGE-M3 for Indonesian)
2. Implement hybrid search (dense + sparse/BM25)
3. Add meeting-level and organization-level filtering
4. Create MCP server for search
5. Benchmark retrieval quality
```
**Deliverable**: Enhanced `rag_engine.py` + search MCP

#### Day 12-13: RAG Pipeline (AI-010)
```bash
# build agent with mcp-builder + composio
1. Implement Celery tasks for async indexing
2. Add document chunking strategies (semantic, fixed, recursive)
3. Implement incremental indexing (only new/changed)
4. Add re-ranking with cross-encoder
5. MCP server for RAG operations
```
**Deliverable**: `celery_worker.py` + indexing tasks + MCP

#### Day 14-15: AI Chat Completion (AI-011)
```bash
# build agent with webapp-testing + grill-me
1. Grill-me chat UX flow (plan agent)
2. Implement streaming responses
3. Add citation tracking with line numbers
4. Multi-meeting context support
5. Conversation memory (Redis)
6. E2E tests with Playwright
```
**Deliverable**: Complete chat API + UI integration

---

## Technical Debt & Infrastructure

| Item | Priority | Owner |
|------|----------|-------|
| Celery + Redis setup for async AI tasks | P0 | build |
| GPU Docker Compose for AI service | P0 | build |
| HuggingFace token for Pyannote | P0 | plan |
| PostgreSQL + PGVector migration | P1 | build |
| MinIO object storage integration | P1 | build |
| Authentication + RBAC middleware | P1 | build |
| Monitoring (Prometheus + Grafana) | P2 | general |
| CI/CD GitHub Actions | P2 | build |

---

## Quality Gates

| Gate | Criteria | Tool |
|------|----------|------|
| **Pre-commit** | Lint, typecheck, format | ruff, mypy, prettier |
| **Unit Tests** | >80% coverage on services | pytest |
| **Integration Tests** | API endpoints return expected | webapp-testing (Playwright) |
| **Plan Review** | Grill-me before implementation | grill-me skill |
| **Code Review** | understand-anything impact analysis | explore agent |
| **Documentation** | stop-slop cleaned | stop-slop skill |

---

## Communication Protocol

### Daily Standup (Async)
```markdown
## Daily Standup — {{date}}
### build agent
- Done: {{task}}
- Next: {{task}}
- Blockers: {{issue}}

### plan agent
- Architecture decision: {{decision}}
- Review needed: {{item}}

### explore agent
- Codebase insight: {{finding}}
- Impact: {{assessment}}
```

### Handoff Protocol (for long tasks)
```bash
# When switching agents or ending session
/skills use handoff
# Creates: /tmp/handoff-{{task}}-{{timestamp}}.md
```

### Skill Activation
```bash
# Before complex task
/skills use grill-me "Review plan for AI-007 Context Engine"

# During implementation
/skills use webapp-testing "Test transcription endpoint"

# After coding
/skills use stop-slop "Clean up API documentation"
```

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pyannote HF token issues | High | High | Pre-configure token, fallback to mock |
| GPU memory OOM (WhisperX + Pyannote) | Medium | High | Sequential processing, chunking |
| Indonesian NLP accuracy | Medium | Medium | GovKB post-processing, eval dataset |
| RAG retrieval quality | Medium | High | Hybrid search, re-ranking, eval |
| Celery task failures | Medium | Medium | Retry policy, dead letter queue |
| Model API rate limits | Low | Medium | Kiro unlimited fallback, local models |

---

## Success Metrics (Phase 13)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Transcription WER (Indonesian) | <15% | Test set |
| Diarization DER | <20% | Test set |
| Minutes generation time | <60s for 60min meeting | Benchmark |
| RAG retrieval precision@5 | >0.7 | Eval set |
| AI Chat response time | <3s | P95 |
| Pipeline success rate | >95% | Monitoring |

---

## Next Immediate Actions

1. **Setup GPU environment** — `docker-compose -f docker-compose.gpu.yml up`
2. **Configure HF_TOKEN** — Add to `.env` for Pyannote
3. **Run grill-me on AI-001 plan** — Validate WhisperX approach
4. **Start build agent on AI-001** — Implement WhisperX service
5. **Create Celery worker** — For async pipeline

---

*Generated by professional agent manager — aligned with available agents, skills, and project documentation.*