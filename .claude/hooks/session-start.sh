#!/usr/bin/env bash
# Runs when a Claude Code session starts (local or cloud): installs
# dependencies once so lint, check, unit and e2e tests work immediately.
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ ! -d node_modules ]; then
	npm ci --no-audit --no-fund >/dev/null 2>&1 && echo "tempra: npm ci done"
fi
