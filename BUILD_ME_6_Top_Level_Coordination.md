# BUILD ME 6 - Top-Level Coordination Files

Instructions for Execution Agent: Populate the top-level project files with the following content.

## File: README.md
```markdown
# 🌊 INSTABIDS HOMEOWNER AGENT SWARM

This repository contains the complete source code for the InstaBids Homeowner Agent Swarm, the proof-of-concept for the world's first living AI organism.

## 🤖 QUICK START FOR AI AGENTS
- **Build Order:** First, run all `SETUP ME` documents. Then, populate all `BUILD ME` documents.
- **Critical Rules:**
  - ❌ **NO** direct agent communication (use Redis Streams only).
  - 🛡️ Contact protection is **ABSOLUTE**.
  - 💰 Cost limits are enforced programmatically.

## 🧪 TESTING STRATEGY
- **Run Tests:** `python -m pytest tests/`
- **Security Mandate:** Contact protection tests must maintain 100% pass rate.

## 🚀 DEPLOYMENT
- Use `docker-compose up --build` to run the system locally after setup.
```

## File: AGENT_ASSIGNMENTS.md
```markdown
# Agent Build Assignments & Paths

This document is a reference for the logical separation of concerns within the swarm.

- **AGENT 1: CORE INFRASTRUCTURE** (`core/`, `deployment/`)
- **AGENT 2: HOMEOWNER INTAKE** (`agents/homeowner_intake/`)
- **AGENT 3: PROJECT SCOPE** (`agents/project_scope/`)
- **AGENT 4: COMMUNICATION FILTER** (`agents/communication_filter/`)
- **AGENT 5: PAYMENT GATE** (`agents/payment_gate/`)
- **AGENT 6: UI GENERATOR & FRONTEND** (`agents/ui_generator/`, `ui/`)
```

## File: CODEBASE_MANIFEST.json
```json
{
  "project": "instabids-homeowner-swarm",
  "version": "1.0.0",
  "architecture": "event-driven-agent-swarm",
  "entryPoints": {
    "api": "main.py",
    "intake_agent": "agents/homeowner_intake/intake_agent.py"
  },
  "testCommand": "python -m pytest tests/",
  "buildCommand": "docker-compose up -d --build",
  "criticalRules": [
    "NO_DIRECT_AGENT_COMMUNICATION",
    "CONTACT_PROTECTION_ABSOLUTE"
  ]
}
```

## File: requirements.txt
```txt
# Core Backend & API
fastapi
uvicorn[standard]
pydantic
python-dotenv

# Agent & AI Frameworks
langchain
langchain-openai

# Database & Cache
redis
aioredis
supabase-async

# Testing
pytest
pytest-asyncio
httpx
unittest-xml-reporting

# Security
cryptography
```

## File: main.py
```python
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
            data=submission.model_dump()
        )
        logger.info(f"Published project submission {submission.project_id}")
        return {"message": "Project submitted to the agent swarm.", "projectId": submission.project_id, "messageId": message_id}
    except Exception as e:
        logger.error(f"Failed to submit project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process project submission.")
```