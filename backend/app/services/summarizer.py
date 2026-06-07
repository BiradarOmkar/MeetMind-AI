import os
import json
import re
from openai import AsyncOpenAI
from app.models.schemas import StructuredOutputSchema, ActionItemSchema
from app.utils.logger import logger
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

client = AsyncOpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

BART_MODEL = "meta-llama/llama-3.2-3b-instruct:free"

async def call_llm(messages: list, model: str = BART_MODEL, temperature: float = 0.3) -> str:
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=2048
    )
    return response.choices[0].message.content.strip()

async def summarize_meeting(text: str, model_choice: str = "bart-llama"):
    logger.info(f"Summarizing meeting with model choice: {model_choice}")
    
    # Step 1: Generate executive summary
    summary_prompt = f"""You are an expert meeting analyst. Summarize the following meeting transcript concisely in 3-5 sentences, focusing on the main goals, outcomes, and next steps.

TRANSCRIPT:
{text[:4000]}

SUMMARY:"""
    
    summary = await call_llm([
        {"role": "system", "content": "You are a professional meeting summarizer. Provide concise, professional summaries."},
        {"role": "user", "content": summary_prompt}
    ])

    # Step 2: Extract structured data
    extract_prompt = f"""Analyze the following meeting transcript and extract structured information. Return ONLY valid JSON with no markdown, no extra text.

TRANSCRIPT:
{text[:4000]}

Return JSON in this exact format:
{{
  "key_points": ["point 1", "point 2"],
  "decisions": ["decision 1", "decision 2"],
  "action_items": [
    {{"task": "task description", "owner": "person name", "status": "pending"}}
  ],
  "issues": ["issue or blocker 1", "issue or blocker 2"]
}}

JSON:"""

    structured_raw = await call_llm([
        {"role": "system", "content": "You are a meeting analysis AI. Extract structured data from meetings and return only valid JSON."},
        {"role": "user", "content": extract_prompt}
    ])

    try:
        # Try to extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', structured_raw)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = json.loads(structured_raw)
        
        action_items = [
            ActionItemSchema(
                task=item.get("task", ""),
                owner=item.get("owner", ""),
                status=item.get("status", "pending")
            )
            for item in data.get("action_items", [])
        ]
        
        structured = StructuredOutputSchema(
            key_points=data.get("key_points", []),
            decisions=data.get("decisions", []),
            action_items=action_items,
            issues=data.get("issues", [])
        )
    except Exception as e:
        logger.error(f"Failed to parse structured output: {e}\nRaw: {structured_raw}")
        structured = StructuredOutputSchema()

    return summary, structured
