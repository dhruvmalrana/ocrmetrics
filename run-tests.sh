#!/bin/bash

echo "🧪 Starting Test Server..."
echo ""
echo "📍 Tests will run at: http://localhost:8000/tests/run-tests.html"
echo ""
echo "Opening browser..."
echo ""

# Start server in background
python3 -m http.server 8000 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Open browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8000/tests/run-tests.html
else
    echo "Please open http://localhost:8000/tests/run-tests.html in your browser"
fi

echo ""
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Wait for Ctrl+C
trap "kill $SERVER_PID; exit" INT
wait $SERVER_PID
