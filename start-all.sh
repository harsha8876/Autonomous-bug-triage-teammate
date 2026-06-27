#!/bin/bash
set -e

node webhook-server/index.js &
WEBHOOK_PID=$!
trap "kill $WEBHOOK_PID 2>/dev/null" EXIT

echo ""
echo "Webhook server started (PID $WEBHOOK_PID)"
echo "Starting ngrok tunnel → paste the URL into the Operator UI"
echo ""

ngrok http 3001
