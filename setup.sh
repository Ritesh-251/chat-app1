#!/bin/bash

echo "🚀 Setting up Ollama Chatbot Fullstack Project"
echo "=============================================="

# Check if required tools are installed
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is available"
    fi
}

echo "📋 Checking dependencies..."
check_dependency "python3"
check_dependency "flutter"
check_dependency "ollama"

echo ""
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Created Python virtual environment"
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Installed Python dependencies"

echo ""
echo "📱 Setting up frontend..."
cd ../frontend

# Install Flutter dependencies
flutter pub get
echo "✅ Installed Flutter dependencies"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start Ollama: ollama serve"
echo "2. Pull a model: ollama pull llama3.1:8b"
echo "3. Start backend: cd backend && source venv/bin/activate && python api_server.py"
echo "4. Start frontend: cd frontend && flutter run -d chrome"
echo ""
echo "📚 Backend API docs will be at: http://localhost:8000/docs"
echo "📱 Frontend will be at: http://localhost:3000 (or Chrome)"
