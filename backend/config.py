"""
Configuration settings for DailyMotivationAgent
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Default Models
DEFAULT_MODEL_PROVIDER = os.getenv("DEFAULT_MODEL_PROVIDER", "gemini")  # 'gemini' or 'openai'
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash-latest")
OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# TTS Configuration
TTS_ENGINE = os.getenv("TTS_ENGINE", "gtts")
AUDIO_DIR = BASE_DIR / "static" / "audio"

# Prompt file path
PROMPT_FILE = BASE_DIR / "prompts" / "motivation_prompt.txt"

# Ensure audio directory exists
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
