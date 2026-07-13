# Quick Reference

## Test 9router
```bash
curl http://localhost:20128/api/health
curl http://localhost:20128/v1/models -H "Authorization: Bearer L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9"
```

## Cek Provider Connections
```bash
sqlite3 ~/.9router/db/data.sqlite "SELECT provider, name, type FROM providerConnections;"
sqlite3 ~/.9router/db/data.sqlite "SELECT name, models FROM combos;"
```

## Test Model Langsung
```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9" \
  -d '{"model":"auto-kr","messages":[{"role":"user","content":"test"}]}'
```

## Re-Auth Kiro OAuth
```bash
# Buka device code URL:
# https://view.awsapps.com/start/#/device
# Masukin kode dari 9router CLI → Providers → Kiro → Add Connection
```

## Start 9router Manual
```bash
npm exec 9router -p 20128 -H 127.0.0.1 --no-browser --skip-update
```
