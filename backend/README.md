# Python FastAPI Backend with Ollama

A powerful backend API built with FastAPI and LangChain, providing AI chat capabilities through Ollama.

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Ollama installed and running
- Git

### Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start Ollama (if not already running):**
   ```bash
   ollama pull llama3.1:8b  # or your preferred model
   ollama serve
   ```

4. **Run the server:**
   ```bash
   python api_server.py
   ```

The server will be available at `http://localhost:8000`

## 📚 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

### Endpoints

#### Authentication
- `POST /auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `POST /auth/login` - Login user
  ```json
  {
    "email": "user@example.com", 
    "password": "password123"
  }
  ```

#### Chat
- `POST /chat` - Send message to AI
  ```json
  {
    "message": "Hello, how are you?",
    "token": "demo-user@example.com"
  }
  ```

- `WebSocket /ws/chat` - Real-time streaming chat

## 🏗️ Architecture

```
backend/
├── api_server.py            # Main FastAPI application
├── requirements.txt         # Python dependencies
├── README.md               # This file
├── example.env             # Environment variables template
└── myenv/                  # Virtual environment (ignored)
```

### Key Components

1. **FastAPI App** - Web framework with automatic docs
2. **LangChain Pipeline** - AI processing with Ollama
3. **Authentication** - Simple token-based auth (demo)
4. **CORS Middleware** - Enable frontend communication

## 🤖 AI Configuration

### Ollama Models

The default model is `llama3.1:8b`. To change:

1. **Environment variable:**
   ```bash
   export OLLAMA_MODEL=your-model-name
   ```

2. **Code modification:**
   ```python
   runnable = build_chain("your-model-name")
   ```

### Supported Models
- `llama3.1:8b` (recommended)
- `llama2:7b`
- `codellama:7b`
- `mistral:7b`
- Any model available in Ollama

### System Prompt
Customize the AI behavior by modifying the system prompt:
```python
SYSTEM_PROMPT = """You are a helpful assistant. Keep responses concise."""
```

## 🔧 Configuration

### Environment Variables

Create `.env` file for configuration:
```env
OLLAMA_MODEL=llama3.1:8b
OLLAMA_HOST=http://localhost:11434
API_HOST=0.0.0.0
API_PORT=8000
```

### CORS Settings
For production, update CORS origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔒 Security

### Current Implementation (Demo)
- In-memory user storage
- Simple token-based authentication
- No password hashing

### Production Recommendations
1. **Database Integration:**
   ```bash
   pip install sqlalchemy psycopg2-binary
   ```

2. **Password Hashing:**
   ```bash
   pip install bcrypt
   ```

3. **JWT Tokens:**
   ```bash
   pip install python-jose[cryptography]
   ```

4. **Environment Secrets:**
   - Use proper secret management
   - Implement proper JWT validation
   - Add rate limiting

## 🛠️ Development

### Running in Development
```bash
# With auto-reload
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000

# Or using the built-in runner
python api_server.py
```

### Testing
```bash
# Install test dependencies
pip install pytest httpx

# Run tests
pytest
```

### Adding New Endpoints
1. Define Pydantic models for request/response
2. Add route handler to FastAPI app
3. Update documentation

Example:
```python
@app.post("/new-endpoint")
def new_feature(request: YourModel):
    return {"result": "success"}
```

## 📊 Monitoring

### Health Check
- `GET /docs` - API documentation and health
- Monitor Ollama service status
- Check response times

### Logging
Add logging for production:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

## 🔍 Troubleshooting

### Common Issues

1. **Ollama not responding**
   ```bash
   ollama serve
   # Check if running on port 11434
   ```

2. **Model not found**
   ```bash
   ollama pull llama3.1:8b
   ollama list  # Check available models
   ```

3. **CORS errors**
   - Check allowed origins in middleware
   - Ensure frontend URL is permitted

4. **Import errors**
   ```bash
   pip install -r requirements.txt
   # Ensure virtual environment is activated
   ```

### Debug Mode
```bash
# Run with debug logging
python api_server.py --log-level debug
```
