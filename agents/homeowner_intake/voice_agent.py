# agents/homeowner_intake/voice_agent.py

import os
import logging
import asyncio
from openai import AsyncOpenAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import io

class RealtimeSTT_OpenAI:
    """Handles real-time speech-to-text using OpenAI's Whisper API."""
    def __init__(self):
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable not set.")
        self.client = AsyncOpenAI()

    async def transcribe(self, audio_bytes: bytes) -> str:
        """
        Transcribes a chunk of audio bytes.
        Note: Whisper API doesn't support true real-time streaming like Deepgram.
        This method transcribes complete audio chunks. The frontend will buffer audio
        and send it during pauses in speech.
        """
        try:
            # Whisper expects a file-like object
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "input.webm" # Provide a dummy filename with extension

            transcript = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
            logging.info(f"Whisper transcript: {transcript.text}")
            return transcript.text
        except Exception as e:
            logging.error(f"Whisper transcription error: {e}")
            return ""

class RealtimeTTS_OpenAI:
    """Handles real-time text-to-speech using OpenAI's TTS API."""
    def __init__(self):
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable not set.")
        self.client = AsyncOpenAI()

    async def stream_audio(self, text: str):
        """
        Creates a streaming audio response for the given text.
        This returns an async iterator that yields audio chunks.
        """
        try:
            response = await self.client.audio.speech.create(
                model="tts-1",
                voice="nova", # A clear, professional voice
                response_format="mp3",
                input=text,
            )
            return response.iter_bytes(chunk_size=4096)
        except Exception as e:
            logging.error(f"OpenAI TTS error: {e}")
            return None

class VoiceIntakeAgent:
    """
    Handles a live, streaming voice conversation for project intake
    using the complete OpenAI stack (Whisper, GPT-4o, TTS).
    """
    def __init__(self, project_id: str, client_socket):
        self.project_id = project_id
        self.client_socket = client_socket
        self.logger = logging.getLogger(f"agent.voice_intake.{project_id}")
        
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable must be set.")
        
        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0.7)
        self.stt = RealtimeSTT_OpenAI()
        self.tts = RealtimeTTS_OpenAI()

        self.conversation_history = [
            SystemMessage(content="You are a friendly and helpful home improvement consultant for Instabids. Your goal is to understand the user's project needs through a natural conversation. Start by greeting them and asking how you can help with their project today. Keep your responses concise and conversational.")
        ]

    async def start_conversation(self):
        """Generates and streams the initial greeting from the agent."""
        initial_response = await self.llm.ainvoke(self.conversation_history)
        self.conversation_history.append(initial_response)
        self.logger.info(f"Agent greeting: {initial_response.content}")
        
        audio_stream = await self.tts.stream_audio(initial_response.content)
        if audio_stream:
            async for chunk in audio_stream:
                await self.client_socket.send_bytes(chunk)

    async def process_user_audio(self, audio_bytes: bytes):
        """
        Processes a complete audio utterance from the user, gets a response,
        and streams the response audio back.
        """
        # 1. Transcribe User's Speech
        user_text = await self.stt.transcribe(audio_bytes)
        if not user_text:
            return # Ignore empty transcriptions

        self.logger.info(f"User said (transcribed): {user_text}")
        self.conversation_history.append(HumanMessage(content=user_text))

        # 2. Generate Agent's Text Response
        agent_response = await self.llm.ainvoke(self.conversation_history)
        self.logger.info(f"Agent responds: {agent_response.content}")
        self.conversation_history.append(agent_response)

        # 3. Stream Agent's Audio Response
        audio_stream = await self.tts.stream_audio(agent_response.content)
        if audio_stream:
            async for chunk in audio_stream:
                await self.client_socket.send_bytes(chunk)