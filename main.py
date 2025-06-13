import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from core.events.publisher import EventPublisher

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Instabids Agent Swarm API", version="1.0.0")
event_publisher = EventPublisher()

@app.on_event("shutdown")
async def shutdown_event():
    await event_publisher.close()

@app.get("/health", status_code=200)
async def health_check():
    return {"status": "ok"}

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
        return {"message": "Project submitted to the agent swarm.", "projectId": submission.project_id, "messageId": message_id}
    except Exception as e:
        logger.error(f"Failed to submit project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process project submission.")
