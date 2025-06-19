import logging
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.events.publisher import EventPublisher
from agents.homeowner_intake.nlp_processor import NLPProcessor

# --- FastAPI App Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Instabids Agent Swarm API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Existing Endpoints & Services ---
event_publisher = EventPublisher()

@app.on_event("shutdown")
async def shutdown_event():
    await event_publisher.close()

@app.get("/health", status_code=200)
async def health_check():
    return {"status": "ok", "service": "InstaBids Agent Swarm API"}

class ProjectSubmission(BaseModel):
    project_id: str
    contact_info: dict
    project_details: dict

@app.post("/projects/submit", status_code=202)
async def submit_project(submission: ProjectSubmission):
    try:
        message_id = await event_publisher.publish(
            stream="homeowner:project_submitted",
            event_type="homeowner:project_submitted",
            data=submission.model_dump(),
        )
        logger.info(f"Published project submission {submission.project_id}")
        return {
            "message": "Project submitted to the agent swarm.", 
            "projectId": submission.project_id, 
            "messageId": message_id
        }
    except Exception as e:
        logger.error(f"Failed to submit project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process project submission.")

# --- NEW: CopilotKit Backend Implementation ---

# Initialize the NLP Processor from our existing agent logic.
nlp_processor = NLPProcessor()

# Simple CopilotKit-compatible endpoint without external dependency
@app.post("/api/copilotkit")
async def handle_copilot_chat(request: dict):
    """
    CopilotKit-compatible endpoint for AI chat functionality.
    Processes user messages and returns AI responses.
    """
    try:
        # Extract message from CopilotKit request format
        messages = request.get("messages", [])
        if not messages:
            return {"error": "No messages provided"}
        
        # Get the latest user message
        user_message = None
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
        
        if not user_message:
            return {"error": "No user message found"}
        
        # Use our NLP processor to analyze the project description
        if "project" in user_message.lower() or "renovation" in user_message.lower():
            analysis = await nlp_processor.extract_project_info(user_message)
            response_content = f"I've analyzed your project description. Here's what I found:\n\n"
            response_content += f"Project Type: {analysis.get('project_type', 'Not specified')}\n"
            response_content += f"Requirements: {', '.join(analysis.get('requirements', []))}\n"
            response_content += f"Materials: {', '.join(analysis.get('materials', []))}\n"
            
            if analysis.get('unclear_points'):
                response_content += f"\nI have some questions to better understand your needs:\n"
                for question in analysis.get('unclear_points', []):
                    response_content += f"• {question}\n"
        else:
            response_content = "I'm here to help you with home improvement projects. Could you describe what kind of renovation or improvement you're planning?"
        
        # Return in CopilotKit expected format
        return {
            "response": response_content,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"CopilotKit endpoint error: {e}", exc_info=True)
        return {"error": "Failed to process chat request", "details": str(e)}

# Vercel serverless function handler
handler = app
