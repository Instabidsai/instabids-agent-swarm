import logging
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.events.publisher import EventPublisher
from agents.homeowner_intake.nlp_processor import NLPProcessor
from copilot_kit.core.langchain import CopilotKitLangChain
from langchain_openai import ChatOpenAI

# --- FastAPI App Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Instabids Agent Swarm API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
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

# 1. Initialize the NLP Processor from our existing agent logic.
nlp_processor = NLPProcessor()

# 2. Set up the CopilotKit LangChain adapter.
copilot = CopilotKitLangChain(
    # The tools array defines functions the AI can call.
    tools=[
        {
            "name": "analyze_project",
            "description": "Analyzes the user's project description to extract structured requirements and identify clarifying questions.",
            "handler": lambda args: nlp_processor.extract_project_info(args['description']),
            "parameters": [
                {
                    "name": "description",
                    "type": "string",
                    "description": "The user's description of their home improvement project.",
                    "required": True,
                }
            ],
        }
    ],
    # We use the same LLM as our agents for consistency.
    langchain_llm=ChatOpenAI(model_name="gpt-4o"),
)

# 3. Create the API endpoint for the frontend to connect to.
@app.post("/api/copilotkit")
async def handle_copilot_chat(request: dict):
    return await copilot.process_request(request)

# Vercel serverless function handler
handler = app