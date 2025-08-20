#!/bin/bash

# Development helper script for Ollama Chatbot Fullstack

case "$1" in
  "backend")
    echo "🐍 Starting backend server..."
    cd backend
    source venv/bin/activate
    python api_server.py
    ;;
  "frontend")
    echo "📱 Starting Flutter app..."
    cd frontend
    flutter run -d chrome
    ;;
  "setup")
    echo "🔧 Running setup..."
    ./setup.sh
    ;;
  "clean")
    echo "🧹 Cleaning build files..."
    cd frontend && flutter clean
    cd ../backend && find . -name "__pycache__" -type d -exec rm -rf {} +
    echo "✅ Cleaned build files"
    ;;
  *)
    echo "🤖 Ollama Chatbot Development Helper"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Run initial project setup"
    echo "  backend   - Start the Python FastAPI server"
    echo "  frontend  - Start the Flutter app in Chrome"
    echo "  clean     - Clean build files"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh setup"
    echo "  ./dev.sh backend"
    echo "  ./dev.sh frontend"
    ;;
esac
