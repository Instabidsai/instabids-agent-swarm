# core/events/schemas.py
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class ContactInfo(BaseModel):
    email: str
    first_name: str
    last_name: str
    zip_code: str
    city: str
    state: str
    phone: Optional[str] = None

class ProjectDetails(BaseModel):
    raw_description: str

class IntakePayload(BaseModel):
    project_id: str
    contact_info: ContactInfo
    project_details: ProjectDetails

class EventBase(BaseModel):
    event_id: str
    event_type: str
    timestamp: str
    correlation_id: str
    data: Dict[str, Any]
