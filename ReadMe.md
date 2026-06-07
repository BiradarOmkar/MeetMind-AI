

# 📊 MeetingAI – RAG Powered Meeting Summarizer

## Overview

MeetingAI is an AI-powered system that converts raw meeting transcripts into structured insights using summarization, LLM-based extraction, and Retrieval-Augmented Generation (RAG). It allows users to store, search, and query past meetings intelligently.

---

## Features

* AI-based meeting summarization using BART / T5 / Pegasus
* Structured extraction of decisions, action items, and key points using LLaMA 3
* RAG-based semantic search across all meetings
* Dual database system (SQLite + ChromaDB)
* Action item tracking and status updates
* AI-generated Slack and Email follow-up drafts

---

## Tech Stack

* FastAPI
* Python
* React
* SQLite
* ChromaDB
* Hugging Face Transformers
* OpenRouter (LLaMA 3)
* Sentence Transformers (BGE embeddings)

---

## Architecture

User Transcript → Summarization (BART/T5) → LLM Structuring (LLaMA 3) →
SQLite (structured data) + ChromaDB (vector store) → RAG Query System → Response

---

## Setup Instructions

### Backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
npm install
npm start
```

---

## Environment Variables

```
OPENROUTER_API_KEY=your_key_here
DATABASE_URL=sqlite:///meetings.db
CHROMA_PATH=./chroma_db
```

---

## API Endpoints

* POST /upload-transcript
* GET /meetings
* GET /search
* PUT /action-items/{id}
* POST /generate-reminder

---

## Future Improvements

* Real-time transcription using Whisper
* Multi-user collaboration
* Cloud deployment
* Advanced analytics dashboard

---

## Author

Omkar Biradar

---
