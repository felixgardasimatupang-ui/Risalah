#!/bin/bash
set -e

BACKUP_DIR="$(dirname "$0")/../.9router-backup"
DATA_DIR="$HOME/.9router"
DB_DIR="$DATA_DIR/db"
AUTH_DIR="$DATA_DIR/auth"
PORT=20128
HOST=127.0.0.1

log() { echo "[9router] $1"; }

# 1. Create dirs
mkdir -p "$DB_DIR" "$AUTH_DIR"

# 2. Restore machine-id & auth
if [ -f "$BACKUP_DIR/machine-id" ]; then
  cp "$BACKUP_DIR/machine-id" "$DATA_DIR/machine-id"
  log "Machine ID restored"
fi
if [ -f "$BACKUP_DIR/cli-secret" ]; then
  cp "$BACKUP_DIR/cli-secret" "$AUTH_DIR/cli-secret"
  log "CLI secret restored"
fi

# 3. Restore database
if [ -f "$BACKUP_DIR/data.sqlite" ]; then
  cp "$BACKUP_DIR/data.sqlite" "$DB_DIR/data.sqlite"
  log "Database restored"
fi

# 4. Start 9router
log "Starting 9router..."
nohup npm exec 9router -p $PORT -H $HOST --no-browser --skip-update > /tmp/9router.log 2>&1 &
NINEROUTER_PID=$!
log "PID: $NINEROUTER_PID"

# Wait for startup
for i in {1..30}; do
  if curl -s http://$HOST:$PORT/api/health > /dev/null 2>&1; then
    log "9router ready!"
    break
  fi
  sleep 1
done

# 5. Login & get cookie
COOKIE_FILE="/tmp/9router-cookies.txt"
RES=$(curl -s -c "$COOKIE_FILE" http://$HOST:$PORT/api/login \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"123456\"}")
if echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else 1)" 2>/dev/null; then
  log "Login OK"
else
  log "Login failed, trying to continue..."
fi

# 6. Source API keys
if [ -f "$BACKUP_DIR/api-keys.env" ]; then
  source "$BACKUP_DIR/api-keys.env"
fi
COOKIES="-b $COOKIE_FILE"

# 7. Setup provider nodes (custom OpenAI-compatible providers)
# Kilo AI
log "Setting up Kilo AI..."
curl -s $COOKIES -X POST http://$HOST:$PORT/api/provider-nodes \
  -H "Content-Type: application/json" \
  -d '{"name":"Kilo AI","prefix":"kilo","baseUrl":"https://api.kilo.ai/api/gateway","type":"openai-compatible","apiType":"chat"}' > /dev/null 2>&1

# xAI Grok
log "Setting up xAI Grok..."
curl -s $COOKIES -X POST http://$HOST:$PORT/api/provider-nodes \
  -H "Content-Type: application/json" \
  -d '{"name":"xAI Grok","prefix":"xai","baseUrl":"https://api.x.ai/v1","type":"openai-compatible","apiType":"chat"}' > /dev/null 2>&1

# 8. Setup API key connections
# OpenRouter
log "Connecting OpenRouter..."
curl -s $COOKIES -X POST http://$HOST:$PORT/api/providers \
  -H "Content-Type: application/json" \
  -d "{\"provider\":\"openrouter\",\"name\":\"OpenRouter\",\"apiKey\":\"$OPENROUTER_API_KEY\"}" > /dev/null 2>&1

# Kilo AI
log "Connecting Kilo AI..."
KILO_NODE=$(sqlite3 "$DB_DIR/data.sqlite" "SELECT id FROM providerNodes WHERE name='Kilo AI' LIMIT 1;" 2>/dev/null)
if [ -n "$KILO_NODE" ]; then
  curl -s $COOKIES -X POST http://$HOST:$PORT/api/providers \
    -H "Content-Type: application/json" \
    -d "{\"provider\":\"$KILO_NODE\",\"name\":\"Kilo AI\",\"apiKey\":\"$KILO_API_KEY\"}" > /dev/null 2>&1
fi

# xAI Grok
log "Connecting xAI Grok..."
XAI_NODE=$(sqlite3 "$DB_DIR/data.sqlite" "SELECT id FROM providerNodes WHERE name='xAI Grok' LIMIT 1;" 2>/dev/null)
if [ -n "$XAI_NODE" ]; then
  curl -s $COOKIES -X POST http://$HOST:$PORT/api/providers \
    -H "Content-Type: application/json" \
    -d "{\"provider\":\"$XAI_NODE\",\"name\":\"xAI Grok\",\"apiKey\":\"$XAI_API_KEY\"}" > /dev/null 2>&1
fi

# 9. Setup combo chains
log "Creating combo chains..."
python3 -c "
import uuid, json, subprocess, os

now = '2026-07-09T05:10:00.000Z'
db = os.path.expanduser('~/.9router/db/data.sqlite')

combos = [
    ('auto-free', '[{\"provider\":\"openrouter\",\"model\":\"qwen/qwen3-32b\"},{\"provider\":\"kilo\",\"model\":\"kilo-auto/free\"}]'),
    ('auto-coding', '[{\"provider\":\"openrouter\",\"model\":\"qwen/qwen3-coder-plus\"},{\"provider\":\"openrouter\",\"model\":\"deepseek/deepseek-chat\"},{\"provider\":\"kilo\",\"model\":\"kilo-auto/free\"}]'),
    ('frontier', '[{\"provider\":\"openrouter\",\"model\":\"qwen/qwen3-32b\"},{\"provider\":\"kilo\",\"model\":\"kilo-auto/balanced\"}]'),
    ('auto-kr', '[{\"provider\":\"openrouter\",\"model\":\"qwen/qwen3-32b\"},{\"provider\":\"kr\",\"model\":\"auto\"}]'),
    ('kr-coding', '[{\"provider\":\"kr\",\"model\":\"claude-sonnet-4.5\"},{\"provider\":\"kr\",\"model\":\"auto\"}]'),
]

for name, models in combos:
    subprocess.run([
        'sqlite3', db,
        f\"INSERT OR IGNORE INTO combos VALUES('{str(uuid.uuid4())}','{name}','','{models}','{now}','{now}');\"
    ], capture_output=True)
print('Combos created')
"

log ""
log "=== 9router READY ==="
log "URL: http://$HOST:$PORT"
log "Key: L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9"
log "PID: $NINEROUTER_PID"
log ""
log "NOTE: Kiro OAuth token expires in 1 hour."
log "To re-auth, open: https://view.awsapps.com/start/#/device and enter code from 9router CLI"
echo ""
