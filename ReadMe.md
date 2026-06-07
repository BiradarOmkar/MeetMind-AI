# 📊 MeetingAI – RAG Powered Meeting Summarizer

> Convert raw meeting transcripts into structured insights using summarization, LLM-based extraction, and Retrieval-Augmented Generation.

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat&logo=python)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react)
![LLaMA](https://img.shields.io/badge/LLaMA_3-OpenRouter-teal?style=flat)
![ChromaDB](https://img.shields.io/badge/ChromaDB-vector_store-orange?style=flat)

---

## 🧭 Overview

MeetingAI is an AI-powered system that converts raw meeting transcripts into structured insights using summarization, LLM-based extraction, and Retrieval-Augmented Generation (RAG). It allows users to store, search, and query past meetings intelligently.

---

## ✨ Features

- 🧠 AI-based meeting summarization using **BART / T5 / Pegasus**
- 📋 Structured extraction of decisions, action items, and key points using **LLaMA 3**
- 🔍 **RAG-based semantic search** across all past meetings
- 🗄️ Dual database system — **SQLite** (structured) + **ChromaDB** (vectors)
- ✅ Action item tracking and status updates
- 📨 AI-generated **Slack and Email** follow-up drafts

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python |
| Frontend | React |
| Structured Storage | SQLite |
| Vector Store | ChromaDB |
| Summarization | Hugging Face Transformers (BART / T5 / Pegasus) |
| LLM Extraction | OpenRouter (LLaMA 3) |
| Embeddings | Sentence Transformers (BGE) |

---

## 🏗️ Architecture

```
User Transcript → Summarization (BART/T5) → LLM Structuring (LLaMA 3)
    → SQLite (structured data) + ChromaDB (vector store)
        → RAG Query System → Response
```

---

## ⚙️ Setup

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

### Environment Variables

Create a `.env` file in the root directory:

```env
OPENROUTER_API_KEY=your_key_here
DATABASE_URL=sqlite:///meetings.db
CHROMA_PATH=./chroma_db
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-transcript` | Upload a meeting transcript |
| `GET` | `/meetings` | List all stored meetings |
| `GET` | `/search` | Semantic search across meetings |
| `PUT` | `/action-items/{id}` | Update action item status |
| `POST` | `/generate-reminder` | Generate Slack/Email follow-up |

---

## 🚀 Future Improvements

- [ ] Real-time transcription using **Whisper**
- [ ] Multi-user collaboration
- [ ] Cloud deployment
- [ ] Advanced analytics dashboard

---

## 👤 Author

**Omkar Biradar**
