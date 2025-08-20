# api_server.py
import os
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# LangChain / Ollama
from langchain_community.llms import Ollama
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.runnable.config import RunnableConfig

# ---------- LangChain pipeline (reusing the same idea as chainlit app) ----------
SYSTEM_PROMPT = """You are a concise, helpful assistant. Keep answers short unless asked for detail."""
PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{question}")
])

def build_chain(model_name: str = "llama3.1:8b"):
    llm = Ollama(model=model_name, temperature=0.2)
    chain = PROMPT | llm | StrOutputParser()
    return chain

runnable = build_chain(os.getenv("OLLAMA_MODEL", "mistral:latest"))

# ---------- FastAPI ----------
app = FastAPI(title="LangChain-Ollama Chat API", version="1.0.0")

# Enhanced CORS configuration for development - allows all frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "*",
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "X-PINGOTHER",
        "User-Agent",
        "Keep-Alive",
        "Host",
        "Accept-Encoding",
        "Connection",
        "Upgrade-Insecure-Requests",
    ],
    expose_headers=["*"],
    max_age=3600,
)

# --------- (Optional) very simple in-memory auth demo ----------
class RegisterBody(BaseModel):
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

USERS: Dict[str, str] = {}  # email -> password (replace with real DB in prod)

# Health check endpoint (doesn't require Ollama)
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is running", "cors_enabled": True}

# Explicit OPTIONS handler for CORS preflight
@app.options("/{full_path:path}")
def options_handler(full_path: str):
    return {"message": "OK"}

@app.post("/auth/register")
def register(body: RegisterBody):
    if body.email in USERS:
        return {"ok": False, "message": "User already exists"}
    USERS[body.email] = body.password
    return {"ok": True, "message": "Registered"}

@app.post("/auth/login")
def login(body: LoginBody):
    if USERS.get(body.email) == body.password:
        # Return a demo token; replace with JWT if you like
        return {"ok": True, "token": f"demo-{body.email}"}
    return {"ok": False, "message": "Invalid credentials"}

# ---------- REST chat (simple, non-streaming) ----------
class ChatRequest(BaseModel):
    message: str
    token: Optional[str] = None  # pass back the demo token if you want to check

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # (Optional) check token here if you want auth
    text = req.message.strip()
    if not text:
        return {"reply": "Please send a non-empty message."}

    out = runnable.invoke({"question": text}, config=RunnableConfig())
    return {"reply": out}

# ---------- WebSocket (optional: for streaming) ----------
@app.websocket("/ws/chat")
async def ws_chat(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            # client sends {"message": "..."}
            payload = await ws.receive_json()
            user_msg = (payload.get("message") or "").strip()
            if not user_msg:
                await ws.send_json({"type": "error", "data": "Empty message"})
                continue

            # Stream tokens
            await ws.send_json({"type": "start"})
            async for chunk in runnable.astream(
                {"question": user_msg},
                config=RunnableConfig()
            ):
                await ws.send_json({"type": "token", "data": chunk})
            await ws.send_json({"type": "end"})
    except WebSocketDisconnect:
        pass
