"""
FastAPI Application for DailyMotivationAgent
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uvicorn

from backend.config import HOST, PORT, DEBUG, BASE_DIR
from backend.agent import DailyMotivationAgent
from backend.tts import TTSService

# Initialize FastAPI app
app = FastAPI(
    title="DailyMotivationAgent",
    description="AI-powered daily motivation with quotes, messages, and voice",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Initialize services
agent = DailyMotivationAgent()
tts_service = TTSService()


@app.get("/", response_class=HTMLResponse)
async def home():
    """Serve the main HTML page"""
    html_path = BASE_DIR / "frontend" / "index.html"
    if html_path.exists():
        return FileResponse(html_path)
    raise HTTPException(status_code=404, detail="Frontend not found")


@app.get("/frontend/{filename}")
async def serve_frontend(filename: str):
    """Serve frontend static files (CSS, JS)"""
    file_path = BASE_DIR / "frontend" / filename
    if file_path.exists():
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")


@app.get("/api/motivation")
async def get_motivation(language: str = "English", category: str = "general"):
    """
    Generate motivational quote and message with TTS

    Args:
        language: Language for content (English or Urdu)
        category: Motivation category (general, success, health, etc.)

    Returns:
        JSON with quote, message, and audio URL
    """
    try:
        # Generate motivation content
        motivation = await agent.generate_motivation(language, category)

        # Generate TTS audio
        full_text = f"{motivation['quote']}. {motivation['message']}"
        audio_result = tts_service.generate_audio(full_text, language)

        # Cleanup old audio files
        tts_service.cleanup_old_files()

        return {
            "success": True,
            "quote": motivation["quote"],
            "message": motivation["message"],
            "language": motivation["language"],
            "category": motivation.get("category", "general"),
            "provider": motivation["provider"],
            "audio_url": audio_result.get("audio_url")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/about")
async def get_about():
    """Return the README content for About page"""
    try:
        readme_path = BASE_DIR / "CLAUDE.md"
        if readme_path.exists():
            with open(readme_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"success": True, "content": content}
        return {"success": False, "content": "About content not found."}
    except Exception as e:
        return {"success": False, "content": str(e)}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "DailyMotivationAgent",
        "provider": agent.provider
    }


@app.post("/api/switch-provider")
async def switch_provider(provider: str):
    """Switch between AI providers (gemini/openai)"""
    if agent.switch_provider(provider):
        return {"success": True, "provider": provider}
    raise HTTPException(status_code=400, detail="Invalid provider. Use 'gemini' or 'openai'")


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG
    )
