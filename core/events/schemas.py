from pydantic import BaseModel
from typing import Optional, Dict, Any


class ContactInfo(BaseModel):
    email: str
    first_name: str
    last_name: str
    zip_code: str
    city: str
    state: str


class ProjectDetails(BaseModel):
    raw_description: str


class IntakePayload(BaseModel):
    project_id: str
    contact_info: ContactInfo
    project_details: ProjectDetails


class ScopeCompletePayload(BaseModel):
    project_id: str
    structured_scope: Dict[str, Any]

