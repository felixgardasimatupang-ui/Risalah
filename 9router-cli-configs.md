# 9Router CLI Configurations

All tools connect to: `http://localhost:20128/v1`
API Key: `L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9`
Default Model: `free-developer`

---

## Claude Code

**File:** `~/.claude/settings.json`
```json
{
  "effortLevel": "high",
  "proxy": "http://localhost:20128/v1",
  "apiKey": "L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9"
}
```

## OpenCode

**File:** `~/.config/opencode/opencode.jsonc`
```jsonc
{
  "model": "9router:free-developer",
  "provider": {
    "9router": {
      "options": {
        "baseURL": "http://localhost:20128/v1",
        "apiKey": "L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9"
      }
    }
  }
}
```

## Cline (VS Code)

**File:** `.vscode/settings.json` or VS Code settings
```json
{
  "cline.apiProvider": "openai",
  "cline.openAiBaseUrl": "http://localhost:20128/v1",
  "cline.openAiKey": "L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9",
  "cline.model": "free-developer"
}
```

## Continue

**File:** `~/.continue/config.json`
```json
{
  "models": [{
    "title": "9Router FREE-DEVELOPER",
    "provider": "openai",
    "model": "free-developer",
    "apiKey": "L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9",
    "apiBase": "http://localhost:20128/v1"
  }],
  "tabAutocompleteModel": {
    "title": "9Router Fast",
    "provider": "openai",
    "model": "free-developer",
    "apiKey": "L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9",
    "apiBase": "http://localhost:20128/v1"
  }
}
```

## Roo Code (VS Code)

**File:** `.vscode/settings.json` or VS Code settings
```json
{
  "roo-code.apiProvider": "openai",
  "roo-code.openAiBaseUrl": "http://localhost:20128/v1",
  "roo-code.openAiKey": "L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9",
  "roo-code.model": "free-developer"
}
```

## Aider

**File:** `~/.aider.conf.yml`
```yaml
model: free-developer
api-key: L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9
api-base: http://localhost:20128/v1
```

## Cursor

**File:** `.cursorrules` (project root) or Cursor settings
```json
{
  "cursor.general.baseUrl": "http://localhost:20128/v1",
  "cursor.general.apiKey": "L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9",
  "cursor.general.model": "free-developer"
}
```

## Codex

```bash
export CODEX_API_BASE="http://localhost:20128/v1"
export CODEX_API_KEY="L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9"
export CODEX_MODEL="free-developer"
```

---

## Shell Aliases (add to ~/.zshrc)

```bash
alias 9router-status='launchctl print gui/$(id -u)/com.9router.oneapi | grep -E "state|program"'
alias 9router-start='launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.9router.oneapi.plist'
alias 9router-stop='launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.9router.oneapi.plist'
alias 9router-restart='launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.9router.oneapi.plist 2>/dev/null; launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.9router.oneapi.plist'
alias 9router-test='curl -s http://localhost:20128/v1/chat/completions -H "Authorization: Bearer L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9" -H "Content-Type: application/json" -d "{\"model\":\"free-developer\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}"'
```
