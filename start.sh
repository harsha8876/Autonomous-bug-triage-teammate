#!/bin/bash
echo '🚀 Starting Operator...'

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo '❌ Docker is not running. Please open Docker Desktop first.'
  exit 1
fi

echo '✅ Docker is running'

# Export env vars for this session
export POD=019f0891-5981-774f-967b-18209c907826
export LEMMA_ORG_ID=019f0863-f6ed-77a8-b212-3969f778be18

# Start Lemma stack
lemma-stack start &
sleep 5

# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start webhook server with cloud auth token
export LEMMA_TOKEN=$(LEMMA_SERVER=cloud lemma auth print-token)
cd webhook-server && node index.js &
cd ..

echo ''
echo '✅ Lemma stack + webhook server running'
echo ''
