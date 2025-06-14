# agents/homeowner_intake/intake_schemas.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal, Dict, Any
from uuid import UUID

class ProjectCore(BaseModel):
    project_type: Optional[str] = Field(None, description="High-level category, e.g., 'Roofing', 'Kitchen'")
    project_nature: Optional[Literal['REPAIR', 'REPLACEMENT', 'NEW_INSTALLATION', 'RECURRING_SERVICE', 'LABOR_ONLY']] = Field(None, description="The fundamental nature of the work.")

class ProjectIntent(BaseModel):
    urgency_level: Optional[Literal['EMERGENCY', 'URGENT', 'DEFINED_TIMELINE', 'FLEXIBLE']] = Field(None, description="Timeframe for project completion.")
    motivation_level: Optional[Literal['NEED_TO_GET_DONE', 'EXPLORING_OPTIONS', 'DREAM_PROJECT', 'PRICE_SHOPPING']] = Field(None, description="Homeowner's commitment level.")

class ProjectScope(BaseModel):
    description: str = Field(..., description="The homeowner's initial raw description.")
    pain_points: List[str] = Field(default_factory=list, description="What problems the homeowner is trying to solve.")
    ideal_outcomes: List[str] = Field(default_factory=list, description="What success looks like for the homeowner.")
    additional_info: Optional[str] = Field(None, description="Special instructions for the contractor.")
    media_attachments: List[Dict[str, Any]] = Field(default_factory=list, description="List of uploaded images or videos.")

class InstabidsFeatures(BaseModel):
    group_bidding_interest: bool = Field(False, description="Whether the homeowner is interested in group bidding.")

class FullProjectData(BaseModel):
    """
    The complete, rich data model that the agent swarm aims to populate
    through the conversational intake process.
    """
    project_id: UUID
    homeowner_id: UUID
    zip_code: str = Field(..., regex=r'^\d{5}(?:[-\s]\d{4})?$')
    core: ProjectCore = Field(default_factory=ProjectCore)
    intent: ProjectIntent = Field(default_factory=ProjectIntent)
    scope: ProjectScope
    features: InstabidsFeatures = Field(default_factory=InstabidsFeatures)
