#!/bin/bash
echo '🚀 Starting Operator...'

# Export env vars for this session
export POD=019f0891-5981-774f-967b-18209c907826
export LEMMA_ORG_ID=019f0863-f6ed-77a8-b212-3969f778be18

# Start Lemma stack
lemma-stack start &
sleep 5

# Start webhook server
cd webhook-server && node index.js &
cd ..

echo ''
echo '✅ Lemma stack + webhook server running'
echo ''
echo '👉 Terminal 2: cd operator-ui && npm run dev'
echo '👉 Terminal 3: ngrok http 3001  then paste URL into GitHub webhook settings'
echo ''
