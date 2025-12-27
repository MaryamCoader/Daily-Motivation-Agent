"""
Text-to-Speech Service for DailyMotivationAgent
"""
import uuid
from pathlib import Path
from gtts import gTTS
from backend.config import AUDIO_DIR


class TTSService:
    """Text-to-Speech conversion service using gTTS"""

    # Language codes mapping
    LANGUAGE_CODES = {
        "English": "en",
        "Urdu": "ur",
        "english": "en",
        "urdu": "ur"
    }

    def __init__(self):
        self.audio_dir = Path(AUDIO_DIR)
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def _get_language_code(self, language: str) -> str:
        """Get gTTS language code from language name"""
        return self.LANGUAGE_CODES.get(language, "en")

    def generate_audio(self, text: str, language: str = "English") -> dict:
        """
        Convert text to speech and save as MP3

        Args:
            text: The text to convert to speech
            language: Language for TTS (English or Urdu)

        Returns:
            dict with audio file path and URL
        """
        try:
            # Generate unique filename
            filename = f"motivation_{uuid.uuid4().hex[:8]}.mp3"
            filepath = self.audio_dir / filename

            # Get language code
            lang_code = self._get_language_code(language)

            # Generate TTS audio
            tts = gTTS(text=text, lang=lang_code, slow=False)
            tts.save(str(filepath))

            return {
                "success": True,
                "filename": filename,
                "filepath": str(filepath),
                "audio_url": f"/static/audio/{filename}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "audio_url": None
            }

    def cleanup_old_files(self, max_files: int = 50):
        """Remove old audio files to save disk space"""
        try:
            audio_files = sorted(
                self.audio_dir.glob("motivation_*.mp3"),
                key=lambda x: x.stat().st_mtime
            )

            if len(audio_files) > max_files:
                files_to_delete = audio_files[:-max_files]
                for file in files_to_delete:
                    file.unlink()
                return len(files_to_delete)
            return 0
        except Exception:
            return 0
