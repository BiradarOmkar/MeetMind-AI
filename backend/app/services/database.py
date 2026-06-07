import sqlite3
import json
import os
from app.models.schemas import (
    MeetingListResponse, MeetingDetailResponse,
    ActionItemSchema, StructuredOutputSchema
)
from app.utils.logger import logger

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "meetings.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id TEXT PRIMARY KEY,
            title TEXT,
            date TEXT,
            participants TEXT,
            transcript TEXT,
            summary TEXT,
            key_points TEXT,
            decisions TEXT,
            issues TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id TEXT,
            task TEXT,
            owner TEXT,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (meeting_id) REFERENCES meetings(id)
        )
    """)
    conn.commit()

    # Schema migration: check for missing columns in meetings table
    c.execute("PRAGMA table_info(meetings)")
    columns = [row[1] for row in c.fetchall()]
    
    mutated = False
    for col in ["key_points", "decisions", "issues"]:
        if col not in columns:
            logger.info(f"Adding column {col} to meetings table.")
            c.execute(f"ALTER TABLE meetings ADD COLUMN {col} TEXT")
            mutated = True
            
    if mutated:
        conn.commit()
        
    conn.close()
    logger.info("Database initialized.")

def save_meeting(meeting_id, title, date, participants, transcript, summary, structured):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO meetings (id, title, date, participants, transcript, summary, key_points, decisions, issues)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        meeting_id, title, date, participants, transcript, summary,
        json.dumps(structured.key_points),
        json.dumps(structured.decisions),
        json.dumps(structured.issues)
    ))
    for item in structured.action_items:
        c.execute("""
            INSERT INTO action_items (meeting_id, task, owner, status)
            VALUES (?, ?, ?, ?)
        """, (meeting_id, item.task, item.owner, item.status))
    conn.commit()
    conn.close()
    logger.info(f"Meeting {meeting_id} saved to database.")

def get_all_meetings():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, title, date, participants, summary FROM meetings ORDER BY rowid DESC")
    rows = c.fetchall()
    conn.close()
    return [
        MeetingListResponse(
            meeting_id=row["id"],
            title=row["title"],
            date=row["date"],
            participants=row["participants"],
            summary=row["summary"]
        )
        for row in rows
    ]

def get_meeting_by_id(meeting_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM meetings WHERE id=?", (meeting_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return None
    c.execute("SELECT id, task, owner, status FROM action_items WHERE meeting_id=?", (meeting_id,))
    items = c.fetchall()
    conn.close()
    return MeetingDetailResponse(
        meeting_id=row["id"],
        title=row["title"],
        date=row["date"],
        participants=row["participants"],
        summary=row["summary"],
        transcript=row["transcript"],
        key_points=json.loads(row["key_points"] or "[]"),
        decisions=json.loads(row["decisions"] or "[]"),
        action_items=[ActionItemSchema(id=i["id"], task=i["task"], owner=i["owner"], status=i["status"]) for i in items],
        issues=json.loads(row["issues"] or "[]")
    )

def update_action_item_status(item_id: int, status: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE action_items SET status=? WHERE id=?", (status, item_id))
    conn.commit()
    conn.close()

def get_all_action_items():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, task, owner, status FROM action_items ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    return [ActionItemSchema(id=r["id"], task=r["task"], owner=r["owner"], status=r["status"]) for r in rows]

def get_all_decisions():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, title, decisions FROM meetings")
    rows = c.fetchall()
    conn.close()
    result = []
    for row in rows:
        decisions = json.loads(row["decisions"] or "[]")
        for d in decisions:
            result.append({"meeting_id": row["id"], "meeting_title": row["title"], "decision": d})
    return result
