# 9router — Free AI Router untuk AI Tools

## Overview

9router adalah [decolua/9router](https://github.com/decolua/9router) — smart AI gateway open-source (18K+ ⭐). Semua provider gratis terpusat via satu endpoint `http://localhost:20128/v1`, dengan built-in RTK token saver, auto-fallback, & 40+ provider.

## Provider Terintegrasi

| Provider | Status | Rate Limit | Models |
|----------|--------|------------|--------|
| **Groq** | ✅ Active | 14,400 req/day, 30 RPM | llama-3.3-70b-versatile, qwen3-32b, gpt-oss-120b |
| **Cerebras** | ✅ Active | 1M token/day, ~2600 tok/s | gpt-oss-120b, zai-glm-4.7, qwen-3-235b, llama-4-scout |
| **OpenRouter** | ✅ Active | 27 models free (50 req/day per model) | via API key |
| **Gemini** | ❌ Quota Exhausted | 1,500 req/day | gemini-3.1-pro, gemini-3.1-flash, gemini-3-flash, gemma-4-31b |

## Combo Models (Smart Routing)

| Combo | Priority | Channel | Model |
|-------|----------|---------|-------|
| **free-developer** (default) | P1 | Groq | llama-3.3-70b-versatile |
| | P2 | Cerebras | zai-glm-4.7 |
| | P3 | Gemini | gemini-3-flash-preview |

## Architecture

### Text Diagram

```
OpenCode/Claude Code/Cursor/etc
         │
         ▼
  9router (localhost:20128) ← real 9router v0.5.18
         │
         ├── Groq ─────────── llama-3.3-70b-versatile
         ├── Cerebras ─────── zai-glm-4.7
         ├── OpenRouter ───── via API key
         └── Gemini ───────── gemini-3-flash-preview
```

### Mermaid Diagram

```mermaid
graph TD
    User[AI Tools] --> Gateway[9Router :20128]
    Gateway --> GR[Groq<br/>llama-3.3-70b]
    Gateway --> CB[Cerebras<br/>zai-glm-4.7]
    Gateway --> OR[OpenRouter<br/>via API key]
    Gateway --> GM[Gemini<br/>gemini-3-flash]
    
    GR -.fail.-> CB
    CB -.fail.-> GM
    
    style Gateway fill:#4a90d9,color:#fff
    style GR fill:#2ecc71,color:#fff
    style CB fill:#3498db,color:#fff
    style OR fill:#f39c12,color:#fff
    style GM fill:#9b59b6,color:#fff
```

## System Options

| Feature | Status | Description |
|---------|--------|-------------|
| RTK Token Saver | ✅ Built-in | Auto-compress tool_result, save 20-40% tokens |
| Caveman Mode | ✅ Built-in | Inject terse-style prompt, save up to 65% output tokens |
| Ponytail | ✅ Built-in | Lazy senior dev prompt, minimal code generation |
| Auto Fallback | ✅ Built-in | 3-tier: Subscription → Cheap → Free |
| Multi-Account | ✅ Built-in | Round-robin per provider |
| Format Translation | ✅ Built-in | OpenAI ↔ Claude ↔ Gemini ↔ Cursor ↔ Kiro ↔ Vertex |
| Real-Time Quota | ✅ Built-in | Live token tracking per provider |

## Service Management

```bash
# Start (via launchd)
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.9router.plist

# Stop
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.9router.plist

# Status
launchctl print gui/$(id -u)/com.9router

# Restart
launchctl kickstart -p gui/$(id -u)/com.9router

# Manual start (for testing, not via launchd)
cd "$ROUTER_DIR"
export PORT=20128 HOSTNAME=127.0.0.1 NEXT_PUBLIC_BASE_URL=http://localhost:20128
node server.js

# Install: npm i -g 9router
# Version: 0.5.18
```

## Admin Access

- **Dashboard**: http://localhost:20128/dashboard
- **API Endpoint**: http://localhost:20128/v1
- **API Key**: `sk-e62fd80253ff2518-kyxcgd-469964b8`
- **CLI Auth Token**: `7aad81062cf8dee7` (from `~/.9router/auth/cli-secret`)
- **DB Location**: `~/.9router/db/data.sqlite`

## OpenCode Config

Config di `~/.config/opencode/opencode.jsonc`:

```jsonc
"9router": {
  "npm": "@ai-sdk/openai-compatible",
  "options": {
    "baseURL": "http://localhost:20128/v1",
    "apiKey": "sk-e62fd80253ff2518-kyxcgd-469964b8"
  }
}
```

## CLI Integrations

Semua tools menggunakan `http://localhost:20128/v1` dengan API key `sk-e62fd80253ff2518-kyxcgd-469964b8`.

| Tool | File | Key Setting |
|------|------|-------------|
| **OpenCode** | `~/.config/opencode/opencode.jsonc` | provider.9router.options.apiKey |
| **Claude Code** | `~/.claude/settings.json` | apiKey |
| **Cline** | `~/.config/cline/cline_desktop_config.json` | apiKey |
| **Continue** | `~/.continue/config.json` | apiKey |
| **Roo Code** | `~/.config/roo-code/config.json` | apiKey |
| **Aider** | `~/.aider.conf.yml` | api-key |
| **Cursor** | Settings → Models → OpenAI Base URL | apiKey |
| **Codex** | `~/.codex/settings.json` | apiKey |

## Security

### Done
- ✅ **9Router real** installed (npm v0.5.18) — replaces One API
- ✅ **Providers**: Groq, Cerebras, OpenRouter, Gemini terkoneksi
- ✅ **Combo model**: `free-developer` (Groq → Cerebras → Gemini fallback)
- ✅ **API Key**: `sk-e62fd80253ff2518-kyxcgd-469964b8`
- ✅ **Launchd service**: `com.9router` — auto-start via launchd
- ✅ **Bind**: `127.0.0.1:20128` (localhost only, tidak accessible dari network)
- ✅ **RTK Token Saver**: Built-in di 9Router (save 20-40% tokens)

### Recommendations
- **Jangan commit** config yang mengandung API keys ke git
- **Rotate keys** di dashboard provider jika ada indikasi bocor
- **Backup SQLite DB** (`~/.one-api/data/one-api.db`) secara berkala
- **Monitor logs** via `~/Library/Logs/9router.log` untuk aktivitas mencurigakan
- **Gunakan env vars** untuk API keys di opencode.jsonc (`"${GROQ_API_KEY}"`) jika perlu share config
- **⚠️ Firewall**: Service saat ini bind `*:20128` (semua interface). Untuk batasi ke localhost:
  ```bash
  # Buat pf rule
  echo 'block in log on en0 proto tcp to any port 20128
  pass in on lo0 proto tcp to any port 20128' | sudo tee /etc/pf.anchors/9router
  sudo pfctl -a "9router" -f /etc/pf.anchors/9router
  sudo pfctl -e
  ```


## Channel Types (One API)

| Type | Provider |
|------|----------|
| 1 | OpenAI |
| 20 | OpenRouter |
| 29 | Groq |
| 50 | OpenAI Compatible (Cerebras, dll) |
| 51 | Gemini (OpenAI Compatible) |

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `connection refused` | Service tidak running | `launchctl kickstart gui/$(id -u)/com.9router.oneapi` |
| `401 invalid token` | API key salah/token expired | Generate token baru di Admin UI → Token |
| `402 quota exhausted` | Quota provider habis | Cek dashboard provider atau tunggu reset (biasanya 24h) |
| `429 rate limited` | Provider throttle | Sistem auto-disable + retry ke channel berikutnya |
| `channel disabled` | Error rate terlalu tinggi | Auto-enable setelah cooldown, atau enable manual di Admin |
| `stream error/garbled` | Model tidak support streaming | Cek model mapping di Admin → Channel → Model Mapping |
| `model not found` | Model alias tidak terdaftar | Cek daftar model di `/v1/models` atau Admin UI |

## Quick Commands

```bash
# Check health
curl http://127.0.0.1:20128/dashboard -o /dev/null -w "%{http_code}"

# List models  
curl http://127.0.0.1:20128/v1/models -H "Authorization: Bearer sk-e62fd80253ff2518-kyxcgd-469964b8"

# Test combo
curl -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer sk-e62fd80253ff2518-kyxcgd-469964b8" \
  -H "Content-Type: application/json" \
  -d '{"model":"free-developer","messages":[{"role":"user","content":"hello"}],"stream":false}'
```

## Reinstall / Upgrade

```bash
npm i -g 9router@latest
launchctl kickstart -p gui/$(id -u)/com.9router
```

```bash
git clone --depth 1 https://github.com/songquanpeng/one-api.git /tmp/one-api-src
cd /tmp/one-api-src
go build -o /tmp/one-api/one-api main.go
launchctl kickstart -p gui/$(id -u)/com.9router.oneapi
```
