# Risalah AI Stack — OpenCode + 9Router

Single source of truth for the AI routing stack used by [opencode](https://opencode.ai).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   opencode                           │
│  (agent orchestrator — reads opencode.json)          │
└────────────┬───────────────────────────┬────────────┘
             │                           │
             ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  opencode.json        │    │  .opencode/agents/*.md   │
│  model routing        │    │  agent instructions      │
│  provider config      │    │  (no hardcoded models)   │
└────────────┬──────────┘    └──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────┐
│                    9Router                            │
│  http://127.0.0.1:20128/v1                           │
│  OpenAI-compatible gateway                            │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ OpenRouter│  │ Kilo AI  │  │ xAI Grok │           │
│  │ (API key) │  │ (API key)│  │ (API key)│           │
│  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐                          │
│  │ Kiro AI  │  │ Combo    │                          │
│  │ (OAuth)  │  │ Chains   │                          │
│  └──────────┘  └──────────┘                          │
└──────────────────────────────────────────────────────┘
```

## Files

| File | Fungsi |
|------|--------|
| `opencode.json` | **Main config** — model routing, provider endpoint, agent definitions |
| `.opencode/agents/*.md` | **Agent instructions** — behavior guidelines per agent |
| `scripts/9router-setup.sh` | **Full restore** — restore 9router DB, providers, combos after restart |
| `scripts/start.sh` | **Quick start** — start 9router if not running |
| `.9router-backup/` | **Backup** — 9router DB snapshot, API keys, machine-id |

## Agents & Model Routing

Defined in `opencode.json` (`agent` section). All models point to `9router/{model-id}` which routes through the 9router API.

| Agent | Model | Mode | Steps | Biaya |
|-------|-------|------|-------|-------|
| **general** | `auto-kr` combo | primary | — | Gratis (OpenRouter 32B → Kiro fallback) |
| **plan** | `kr/deepseek-3.2` | subagent | 8 | Gratis (Kiro AI, unlimited) |
| **build** | `kr-coding` combo | subagent | 20 | Gratis (Kiro Claude Sonnet 4.5 → Kiro auto) |
| **explore** | `openrouter/qwen/qwen3-30b-a3b` | subagent | 8 | Gratis (MoE, 3B aktif/token) |
| **billing** | `kilo/stepfun/step-3.7-flash:free` | subagent | 5 | Gratis (Kilo AI) |

### Model Details

#### OpenRouter (API key)
| Model ID | Context | Kelebihan |
|----------|---------|-----------|
| `openrouter/qwen/qwen3-32b` | 128K | General purpose, gratis |
| `openrouter/qwen/qwen3-14b` | 32K | Fast, ringan |
| `openrouter/qwen/qwen3-8b` | 32K | Paling ringan |
| `openrouter/qwen/qwen3-coder-plus` | 128K | Coding specialist |
| `openrouter/qwen/qwen3-30b-a3b` | 128K | **MoE — 3B aktif/token**, paling hemat |
| `openrouter/deepseek/deepseek-chat` | 64K | Reasoning |
| `openrouter/deepseek/deepseek-r1` | 128K | Deep reasoning |
| `openrouter/google/gemini-2.5-flash` | 128K | Cepat, gratis |
| `openrouter/openai/gpt-4.1-mini` | 1M | Konteks raksasa |

#### Kiro AI (OAuth — unlimited free)
| Model ID | Context | Kelebihan |
|----------|---------|-----------|
| `kr/claude-sonnet-4.5` | 200K | **Paling powerful**, gratis unlimited |
| `kr/claude-sonnet-4` | 200K | Powerful alternatif |
| `kr/claude-haiku-4.5` | 200K | Fast, hemat |
| `kr/deepseek-3.2` | 128K | Reasoning kuat |
| `kr/qwen3-coder-next` | 128K | Coding |
| `kr/minimax-m2.5` | 128K | General |

#### xAI Grok (API key)
| Model ID | Context | Kelebihan |
|----------|---------|-----------|
| `xai/grok-4` | 131K | Flagship Grok |
| `xai/grok-4-fast-reasoning` | 131K | Fast reasoning |
| `xai/grok-code-fast-1` | 131K | Coding specialist |

#### Kilo AI (API key — limited free)
| Model ID | Context | Kelebihan |
|----------|---------|-----------|
| `kilo/kilo-auto/free` | 128K | Auto-routing gratis |
| `kilo/kilo-auto/balanced` | 128K | Balance quality/speed |
| `kilo/stepfun/step-3.7-flash:free` | 32K | Paling ringan (billing) |

### Combo Chains (fallback otomatis)
| Combo | Chain |
|-------|-------|
| `auto-free` | OpenRouter Qwen 32B → Kilo Auto Free |
| `auto-coding` | OpenRouter Coder+ → DeepSeek → Kilo Auto Free |
| `frontier` | OpenRouter Qwen 32B → Kilo Balanced |
| `auto-kr` | OpenRouter Qwen 32B → Kiro Auto |
| `kr-coding` | Kiro Claude Sonnet 4.5 → Kiro Auto |

## Providers di 9Router

| Provider | Type | Auth | Status |
|----------|------|------|--------|
| OpenRouter | built-in | API key (sk-or-...) | ✅ Active |
| Kilo AI | custom node | API key (JWT) | ✅ Active |
| Kiro AI | built-in OAuth | AWS SSO (OAuth token) | ✅ Active |
| xAI Grok | custom node | API key (xai-...) | ✅ Active |

## Cara Restore Setelah Restart

```bash
# Full setup (restore DB, providers, combos)
bash scripts/9router-setup.sh

# Atau quick start aja (kalau DB masih intact)
bash scripts/start.sh
```

## Notes

- **Kiro OAuth token** expires dalam 1 jam. Token refresh didukung, tapi jarang dipakai. Kalau expired, re-auth via 9router CLI.
- **API key providers** (OpenRouter, Kilo, xAI) permanent — langsung jalan setiap restart.
- **Combo chains** ada di database 9router (`combos` table). Setup script recreate otomatis.
- **Agent files** (`.opencode/agents/*.md`) tidak mengandung hardcoded model — semua routing di `opencode.json`.
