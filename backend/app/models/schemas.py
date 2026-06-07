from pydantic import BaseModel
from typing import List, Optional

class ProcessRequest(BaseModel):
    text: str
    model: str
    title: Optional[str] = "Untitled Meeting"
    date: Optional[str] = None
    participants: Optional[str] = ""

class ActionItemSchema(BaseModel):
    id: Optional[int] = None
    task: str
    owner: str
    status: str = "pending"

class StructuredOutputSchema(BaseModel):
    key_points: List[str] = []
    decisions: List[str] = []
    action_items: List[ActionItemSchema] = []
    issues: List[str] = []

class ProcessResponse(BaseModel):
    meeting_id: str
    summary: str
    structured_output: StructuredOutputSchema

class AskRequest(BaseModel):
    question: str

class SourceMeeting(BaseModel):
    meeting_id: str
    title: str
    date: str
    participants: str
    source: str
    text: str
    score: float

class AskResponse(BaseModel):
    answer: str
    sources: List[SourceMeeting]

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

class SearchResponse(BaseModel):
    results: List[SourceMeeting]

class MeetingListResponse(BaseModel):
    meeting_id: str
    title: str
    date: str
    participants: str
    summary: str

class MeetingDetailResponse(BaseModel):
    meeting_id: str
    title: str
    date: str
    participants: str
    summary: str
    transcript: str
    key_points: List[str]
    decisions: List[str]
    action_items: List[ActionItemSchema]
    issues: List[str]

class ActionItemUpdate(BaseModel):
    status: str

class ReminderResponse(BaseModel):
    slack_message: str
    email_subject: str
    email_body: str
