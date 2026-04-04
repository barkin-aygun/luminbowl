#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PORT=8080
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Kill any existing server on the port
pkill -f "python3 -m http.server $PORT" 2>/dev/null || true

# Start static file server in the background
cd "$PROJECT_DIR"
nohup python3 -m http.server $PORT --bind 0.0.0.0 > /tmp/luminbowl-server.log 2>&1 &
echo "LuminBowl server started on port $PORT (PID: $!)"
echo "Access from your phone at: http://<your-host>:$PORT"
