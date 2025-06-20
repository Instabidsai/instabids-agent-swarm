import logging
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.events.publisher import EventPublisher

# --- FastAPI App Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="InstaBids Agent Swarm API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Core Service Components ---
event_publisher = EventPublisher()

@app.on_event("shutdown")
async def shutdown_event():
    await event_publisher.close()

@app.get("/health", status_code=200)
async def health_check():
    return {"status": "ok", "service": "InstaBids Agent Swarm API"}

@app.get("/")
async def root():
    return {"message": "InstaBids Agent Swarm API", "status": "running"}

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

@app.get("/projects/{project_id}/status")
async def get_project_status(project_id: str):
    # Placeholder for project status tracking
    return {
        "projectId": project_id,
        "status": "processing",
        "message": "Project is being processed by the agent swarm."
    }

@app.get("/system/stats")
async def get_system_stats():
    # Placeholder for system statistics
    return {
        "agents": {
            "homeowner_intake": "active",
            "project_scope": "active", 
            "communication_filter": "active",
            "payment_gate": "active",
            "ui_generator": "active"
        },
        "redis_streams": "connected",
        "api_status": "healthy"
    }

# For Vercel/DigitalOcean deployment
handler = app