from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import (
    ProcessRequest, ProcessResponse,
    AskRequest, AskResponse,
    SearchRequest, SearchResponse,
    MeetingListResponse, MeetingDetailResponse,
    ActionItemUpdate, ReminderResponse,
    StructuredOutputSchema, ActionItemSchema, SourceMeeting
)
from app.services.summarizer import summarize_meeting
from app.services.vector_store import store_meeting, query_meetings
from app.services.database import (
    init_db, save_meeting, get_all_meetings,
    get_meeting_by_id, update_action_item_status,
    get_all_action_items, get_all_decisions
)
from app.services.llm import ask_question_with_context, generate_reminder
from app.utils.logger import logger
import uuid

app = FastAPI(title="MeetingAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    logger.info("MeetingAI backend started.")

@app.post("/process", response_model=ProcessResponse)
async def process_meeting(req: ProcessRequest):
    logger.info(f"Processing meeting: {req.title}")
    try:
        meeting_id = str(uuid.uuid4())[:8]
        summary, structured = await summarize_meeting(req.text, req.model)
        save_meeting(
            meeting_id=meeting_id,
            title=req.title or "Untitled Meeting",
            date=req.date or "",
            participants=req.participants or "",
            transcript=req.text,
            summary=summary,
            structured=structured
        )
        store_meeting(
            meeting_id=meeting_id,
            title=req.title or "Untitled Meeting",
            date=req.date or "",
            participants=req.participants or "",
            text=req.text,
            summary=summary
        )
        return ProcessResponse(
            meeting_id=meeting_id,
            summary=summary,
            structured_output=structured
        )
    except Exception as e:
        logger.error(f"Error processing meeting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    logger.info(f"Question asked: {req.question}")
    try:
        results = query_meetings(req.question, n_results=4)
        answer = await ask_question_with_context(req.question, results)
        sources = [
            SourceMeeting(
                meeting_id=r["meeting_id"],
                title=r["title"],
                date=r["date"],
                participants=r["participants"],
                source=r["source"],
                text=r["text"],
                score=r["score"]
            ) for r in results
        ]
        return AskResponse(answer=answer, sources=sources)
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest):
    try:
        results = query_meetings(req.query, n_results=req.limit or 5)
        sources = [
            SourceMeeting(
                meeting_id=r["meeting_id"],
                title=r["title"],
                date=r["date"],
                participants=r["participants"],
                source=r["source"],
                text=r["text"],
                score=r["score"]
            ) for r in results
        ]
        return SearchResponse(results=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/meetings", response_model=list[MeetingListResponse])
async def list_meetings():
    try:
        meetings = get_all_meetings()
        return meetings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/meeting/{meeting_id}", response_model=MeetingDetailResponse)
async def get_meeting(meeting_id: str):
    meeting = get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@app.put("/action-items/{item_id}")
async def update_action_item(item_id: int, update: ActionItemUpdate):
    try:
        update_action_item_status(item_id, update.status)
        return {"success": True, "status": update.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/action-items", response_model=list[ActionItemSchema])
async def get_action_items():
    try:
        return get_all_action_items()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/decisions")
async def get_decisions():
    try:
        return get_all_decisions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/action-items/{item_id}/remind", response_model=ReminderResponse)
async def generate_reminder_for_item(item_id: int):
    try:
        items = get_all_action_items()
        item = next((i for i in items if i.id == item_id), None)
        if not item:
            raise HTTPException(status_code=404, detail="Action item not found")
        reminder = await generate_reminder(item)
        return reminder
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}
