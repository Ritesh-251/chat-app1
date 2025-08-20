# Ollama Chatbot Fullstack

A complete chatbot application built with **Flutter** frontend and **Python FastAPI** backend, powered by **Ollama** for AI conversations.

## 🏗️ Project Structure

```
ollama-chatbot-fullstack/
├── README.md                 # This file
├── .gitignore               # Git ignore rules
├── frontend/                # Flutter mobile/web app
│   ├── lib/
│   ├── pubspec.yaml
│   └── ...
└── backend/                 # Python FastAPI server
    ├── api_server.py
    ├── requirements.txt
    └── ...
```

## 🚀 Quick Start

### Prerequisites

- **Flutter SDK** (latest stable)
- **Python 3.8+**
- **Ollama** installed and running
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ollama-chatbot-fullstack
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python api_server.py
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install Flutter dependencies
flutter pub get

# Update API URL in lib/services/api_service.dart
# Change 'YOUR_BACKEND_URL_HERE' to 'http://localhost:8000'

# Run the app
flutter run -d chrome  # For web
# or
flutter run            # For mobile (with emulator/device connected)
```

## 🔧 Configuration

### Backend Configuration

1. **Ollama Model**: Update the model in `backend/api_server.py`:
   ```python
   runnable = build_chain(os.getenv("OLLAMA_MODEL", "llama3.1:8b"))
   ```

2. **Environment Variables**: Create `.env` file in backend/ if needed:
   ```
   OLLAMA_MODEL=llama3.1:8b
   ```

### Frontend Configuration

1. **API URL**: Update `lib/services/api_service.dart`:
   ```dart
   static const String baseUrl = 'http://localhost:8000';
   ```

2. **Build for different platforms**:
   ```bash
   flutter build web       # Web
   flutter build apk       # Android
   flutter build ios       # iOS
   ```

## 📱 Features

- **User Authentication** (registration/login)
- **Real-time Chat** with Ollama AI models
- **Cross-platform** (Web, iOS, Android)
- **Clean Architecture** with proper separation of concerns
- **Error Handling** and connection status indicators
- **Modern UI** with Material Design

## 🛠️ Development

### Backend Development

- FastAPI with automatic docs at `http://localhost:8000/docs`
- LangChain integration for AI pipeline
- Simple in-memory authentication (replace with database in production)
- CORS enabled for frontend development

### Frontend Development

- Flutter with Material Design 3
- Service-based architecture
- HTTP client for API communication
- Responsive design for multiple screen sizes

## 📚 API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /chat` - Send message to AI
- `GET /docs` - API documentation

## 🔒 Security Notes

- Replace in-memory user storage with proper database
- Implement proper JWT token validation
- Use HTTPS in production
- Validate and sanitize all inputs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- **Ollama** for local AI model hosting
- **LangChain** for AI pipeline framework
- **Flutter** for cross-platform UI
- **FastAPI** for backend framework
