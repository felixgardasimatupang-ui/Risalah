#!/bin/bash
set -e

echo "=== Install opencode CLI ==="
if ! command -v opencode &>/dev/null; then
  npm install -g opencode-ai@latest
else
  echo "opencode already installed"
fi

echo "=== Setup PATH ==="
grep -q 'npm root -g' ~/.bashrc 2>/dev/null || echo 'export PATH=$(npm root -g)/.bin:$PATH' >> ~/.bashrc
grep -q 'npm root -g' ~/.zshrc 2>/dev/null || echo 'export PATH=$(npm root -g)/.bin:$PATH' >> ~/.zshrc
export PATH=$(npm root -g)/.bin:$PATH

echo "=== Start 9router ==="
if pgrep -f "node.*9router" &>/dev/null; then
  echo "9router already running (PID: $(pgrep -f 'node.*9router'))"
else
  nohup npx -y 9router > /tmp/9router.log 2>&1 &
  sleep 3
  if pgrep -f "node.*9router" &>/dev/null; then
    echo "9router started OK (PID: $(pgrep -f 'node.*9router'))"
  else
    echo "9router FAILED to start. Check /tmp/9router.log"
    tail -20 /tmp/9router.log
  fi
fi

echo "=== Setup complete ==="
