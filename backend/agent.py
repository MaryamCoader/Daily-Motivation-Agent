"""
DailyMotivationAgent - Core AI content generation logic
"""
try:
    import google.generativeai as genai
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False
    genai = None

from openai import OpenAI
from jinja2 import Template
from backend.config import (
    GEMINI_API_KEY,
    OPENAI_API_KEY,
    DEFAULT_MODEL_PROVIDER,
    GEMINI_MODEL_NAME,
    OPENAI_MODEL_NAME,
    PROMPT_FILE
)


class DailyMotivationAgent:
    """AI-powered agent for generating motivational content"""

    def __init__(self):
        self.provider = DEFAULT_MODEL_PROVIDER
        self._setup_clients()
        self._load_prompt_template()

    def _setup_clients(self):
        """Initialize AI clients based on available API keys"""
        if GEMINI_API_KEY and GOOGLE_AVAILABLE and genai:
            genai.configure(api_key=GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        else:
            self.gemini_model = None

        if OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        else:
            self.openai_client = None

    def _load_prompt_template(self):
        """Load the prompt template from file"""
        try:
            with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
                self.prompt_template = Template(f.read())
        except FileNotFoundError:
            # Default prompt if file not found
            self.prompt_template = Template("""
You are a motivational speaker and life coach. Generate inspiring content in {{ language }}.

Please provide:
1. A powerful, original motivational quote (1-2 sentences)
2. An encouraging message (2-3 sentences) that expands on the quote's theme

Format your response exactly as:
QUOTE: [Your motivational quote here]
MESSAGE: [Your encouraging message here]

Make it uplifting, positive, and actionable. Focus on themes like growth, resilience, success, self-belief, and taking action.
            """)

    def _render_prompt(self, language: str = "English") -> str:
        """Render the prompt with the specified language"""
        return self.prompt_template.render(language=language)

    def _parse_response(self, response_text: str) -> dict:
        """Parse the AI response to extract quote and message"""
        lines = response_text.strip().split('\n')
        quote = ""
        message = ""

        for line in lines:
            line = line.strip()
            if line.upper().startswith('QUOTE:'):
                quote = line[6:].strip()
            elif line.upper().startswith('MESSAGE:'):
                message = line[8:].strip()

        # Fallback if parsing fails
        if not quote or not message:
            parts = response_text.split('\n\n')
            if len(parts) >= 2:
                quote = parts[0].replace('QUOTE:', '').strip()
                message = parts[1].replace('MESSAGE:', '').strip()
            else:
                quote = response_text[:100] if len(response_text) > 100 else response_text
                message = "Keep pushing forward. Every step counts!"

        return {"quote": quote, "message": message}

    async def generate_motivation(self, language: str = "English") -> dict:
        """Generate motivational quote and message"""
        prompt = self._render_prompt(language)

        try:
            if self.provider == "gemini" and self.gemini_model:
                response = self.gemini_model.generate_content(prompt)
                response_text = response.text
            elif self.provider == "openai" and self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model=OPENAI_MODEL_NAME,
                    messages=[
                        {"role": "system", "content": "You are an inspiring motivational coach."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300
                )
                response_text = response.choices[0].message.content
            else:
                raise ValueError("No AI provider configured. Please set API keys.")

            result = self._parse_response(response_text)
            result["language"] = language
            result["provider"] = self.provider
            return result

        except Exception as e:
            return {
                "quote": "Believe in yourself and all that you are.",
                "message": "Every day is a new opportunity to grow and become better. Take that first step today!",
                "language": language,
                "provider": self.provider,
                "error": str(e)
            }

    def switch_provider(self, provider: str):
        """Switch between AI providers"""
        if provider in ["gemini", "openai"]:
            self.provider = provider
            return True
        return False
