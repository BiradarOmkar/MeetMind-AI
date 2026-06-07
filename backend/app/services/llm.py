import os
from openai import AsyncOpenAI
from app.models.schemas import ActionItemSchema, ReminderResponse
from app.utils.logger import logger
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

client = AsyncOpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

MODEL = "meta-llama/llama-3.2-3b-instruct:free"

async def ask_question_with_context(question: str, context_chunks: list) -> str:
    if not context_chunks:
        return "I don't have enough meeting data to answer that question yet. Please process some meetings first."
    
    context = "\n\n---\n\n".join([
        f"[Meeting: {c['title']} | Date: {c['date']}]\n{c['text']}"
        for c in context_chunks
    ])
    
    prompt = f"""You are MeetingAI, an intelligent assistant with access to meeting records. Answer the question based on the provided meeting context. Be concise, accurate, and helpful.

MEETING CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""

    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are MeetingAI, a helpful assistant that answers questions about meetings based on provided context."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=1024
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return f"I encountered an error while processing your question: {str(e)}"

async def generate_reminder(item: ActionItemSchema) -> ReminderResponse:
    prompt = f"""Generate a professional and friendly reminder for a team member about their action item.

Action Item: {item.task}
Assigned To: {item.owner or 'Team Member'}
Status: {item.status}

Generate:
1. A concise Slack message (2-3 sentences, friendly, actionable)
2. An email subject line
3. A professional email body (3-4 short paragraphs)

Respond ONLY with this JSON format:
{{
  "slack_message": "...",
  "email_subject": "...",
  "email_body": "..."
}}"""

    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You generate professional reminder messages. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=1024
        )
        import json, re
        raw = response.choices[0].message.content.strip()
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = json.loads(raw)
        return ReminderResponse(
            slack_message=data.get("slack_message", f"Hi @{item.owner or 'here'}, a reminder about your task: '{item.task}'"),
            email_subject=data.get("email_subject", f"Reminder: {item.task}"),
            email_body=data.get("email_body", f"Hi {item.owner or 'Team'},\n\nThis is a reminder about your action item: '{item.task}'.\n\nPlease update on the status.\n\nThanks!")
        )
    except Exception as e:
        logger.error(f"Reminder generation error: {e}")
        return ReminderResponse(
            slack_message=f"Hi @{item.owner or 'here'}, just a quick reminder about your task: '{item.task}' from our meeting.",
            email_subject=f"Reminder: {item.task}",
            email_body=f"Hi {item.owner or 'Team'},\n\nJust a quick follow-up reminder for your task: '{item.task}' from the meeting.\n\nThanks!"
        )
