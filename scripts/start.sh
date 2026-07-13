#!/bin/bash
# Quick start 9router + set NINEROUTER_URL for opencode
PORT=20128
HOST=127.0.0.1

# Start 9router if not running
if ! curl -s http://$HOST:$PORT/api/health > /dev/null 2>&1; then
  echo "Starting 9router..."
  nohup npm exec 9router -p $PORT -H $HOST --no-browser --skip-update > /tmp/9router.log 2>&1 &
  sleep 3
fi

# Export env vars
export NINEROUTER_URL="http://$HOST:$PORT"
export NINEROUTER_KEY="L1WDDu1t6mx6MhEO857c22C81f184d39B0E5Cf8d548417F9"

echo "9router: $NINEROUTER_URL"
curl -s $NINEROUTER_URL/api/health
echo ""
