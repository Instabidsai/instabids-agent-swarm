# This is a new agent responsible for handling real-time media streams.
#
# Key Responsibilities:
# - Connect to the LiveKit media server to receive audio and video streams.
# - Use asyncio to process audio and video concurrently without blocking.
# - Sample video frames and send them to the GPT-4o Vision API for analysis.
# - Process audio chunks and send them to the Whisper API for transcription.
# - Publish the structured results (vision analysis and text transcripts) to dedicated Redis Streams.
# - Save significant video frames to Supabase Storage and log them in the new PostgreSQL table.

import asyncio
import base64
import os
import json
import cv2
import numpy as np
from livekit import rtc, agents
from openai import AsyncOpenAI
from core.events.publisher import EventPublisher
from core.memory.supabase_client import SupabaseClient # Assuming this exists for storage

# Initialize clients
openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
event_publisher = EventPublisher()
# supabase_client = SupabaseClient() # This should be properly initialized

class MediaProcessingAgent:
    def __init__(self):
        self.agent = agents.Agent(self.process_stream)
        self.frame_processing_interval = 1.0 / 5.0  # 5 frames per second

    async def process_stream(self, ctx: agents.JobContext):
        """Processes a single user's media stream."""
        video_track_task = asyncio.create_task(self.process_video_track(ctx))
        audio_track_task = asyncio.create_task(self.process_audio_track(ctx))

        await asyncio.gather(video_track_task, audio_track_task)

    async def process_video_track(self, ctx: agents.JobContext):
        """Processes the video track, sending frames to GPT-4o Vision."""
        video_track = None
        for track in ctx.room.local_participant.tracks.values():
            if track.kind == rtc.TrackKind.VIDEO:
                video_track = track
                break
        
        if not video_track:
            return

        async for frame_event in agents.VideoFrameBuffer.from_video_track(video_track):
            # Convert frame to base64
            buffer = frame_event.frame.to_ndarray(format="bgr24")
            _, encoded_image = cv2.imencode(".jpg", buffer)
            base64_image = base64.b64encode(encoded_image).decode("utf-8")

            # Send frame to OpenAI for vision analysis
            try:
                vision_response = await openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Describe what you see in this frame from a homeowner's project walkthrough. Focus on objects, materials, and potential issues."},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                            ],
                        }
                    ],
                    max_tokens=150,
                )
                analysis = vision_response.choices[0].message.content
                if analysis:
                    # Publish vision analysis to Redis Stream
                    await event_publisher.publish(
                        "ai:vision_analysis_results",
                        {"project_id": ctx.room.name, "analysis": analysis, "frame_timestamp": frame_event.frame.timestamp_us}
                    )
            except Exception as e:
                print(f"Error processing video frame: {e}")

            await asyncio.sleep(self.frame_processing_interval)

    async def process_audio_track(self, ctx: agents.JobContext):
        """Processes the audio track, sending it to Whisper for transcription."""
        audio_track = None
        for track in ctx.room.local_participant.tracks.values():
            if track.kind == rtc.TrackKind.AUDIO:
                audio_track = track
                break

        if not audio_track:
            return

        stt = agents.stt.STT()
        async for stt_event in stt.start(ctx, audio_track):
            if stt_event.type == agents.stt.SpeechEventType.FINAL_TRANSCRIPT:
                transcript = stt_event.alternatives[0].text
                if transcript:
                    # Publish transcript to Redis Stream
                    await event_publisher.publish(
                        "ai:speech_to_text_transcripts",
                        {"project_id": ctx.room.name, "transcript": transcript}
                    )
