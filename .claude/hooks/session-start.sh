#!/bin/bash
set -euo pipefail

# Sessions cloud Claude Code uniquement : installe les dépendances npm pour que
# `npx tsc --noEmit` et `npm run build` fonctionnent dès le démarrage.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund
