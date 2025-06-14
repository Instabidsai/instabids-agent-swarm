from pydantic import BaseModel


class ContactInfo(BaseModel):
    email: str
    first_name: str
    last_name: str
    zip_code: str
    city: str
    state: str


class ProjectDetails(BaseModel):
    raw_description: str


class ProjectSubmission(BaseModel):
    project_id: str
    contact_info: ContactInfo
    project_details: ProjectDetails

