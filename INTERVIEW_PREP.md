# MeetingAI RAG: Senior Developer Interview Preparation Guide

This guide is designed to help you confidently explain the architecture, design choices, and technical trade-offs of the **MeetingAI RAG** project during engineering interviews.

---

## 1. Project Elevator Pitch

> "MeetingAI is an intelligent meeting knowledge assistant that transforms raw transcripts into actionable business intelligence. Unlike simple summarization tools that process meetings in isolation, MeetingAI integrates a **Retrieval-Augmented Generation (RAG)** pipeline to store and query knowledge across all historical meetings. 
>
> It implements a **Dual-Store Architecture** (SQLite for relational structured metadata and ChromaDB for vector similarity searches), extracts structured deliverables (decisions, blockers, action items) via LLaMA 3, and features a workflow-oriented **AI Action Item Reminder Composer** to automate follow-up communications on Slack and Email."

---

## 2. Detailed Feature Breakdown

### A. Multi-Model Summarization & Compression Engine
* **Purpose**: Compresses long, unstructured meeting audio transcripts into structured paragraphs.
* **Technicals**: Employs Hugging Face summarization pipelines (`transformers`) with support for three models:
  * **BART (facebook/bart-large-cnn)**: Selected default for its high-fidelity news/conversational text summarization.
  * **T5 (t5-small)**: Lightweight alternative, optimized for speed on low-resource hardware.
  * **Pegasus (google/pegasus-xsum)**: Highly abstractive summarization, ideal for extracting the core message.
* **Fallback Design**: In the event that download limits, network constraints, or hardware crashes prevent loading a specific model, the service catches the exception and falls back to a locally cached BART checkpoint, guaranteeing endpoint availability.

### B. AI-Powered Structured Metadata Extraction
* **Purpose**: Isolates task assignments, timelines, decisions, and blockers from meeting summaries.
* **Technicals**: Routes the summarized meeting text to **Meta-LLaMA-3-8B-Instruct** (via OpenRouter).
* **Guards & Validation**: Utilizes a highly structured few-shot prompt forcing the LLM to output a strict JSON schema containing:
  * `key_points`: list of core themes.
  * `decisions`: chronological registry of agreements.
  * `action_items`: checklist of tasks and owners.
  * `issues`: list of blockers or risks.
* **Resilience**: Employs regex pre-processing to clean markdown delimiters (e.g. ` ```json ` wrappers or double slashes `//`) and falls back to blank templates in case of network timeouts or invalid JSON output.

### C. Persistent Cross-Meeting Vector Indexing
* **Purpose**: Aggregates meeting data across multiple dates into a searchable semantic knowledge base.
* **Technicals**:
  * **Overlap Chunking**: Splitting raw transcripts using a slide-window chunker (500 char chunk size, 100 char overlap) to preserve mid-sentence context.
  * **Multi-Source Embeddings**: Not only is the transcript chunked and indexed, but the overall *summary*, each *decision*, and each *action item* are embedded as separate vectors with appropriate metadata tags.
  * **Metadata Schemas**: Embeddings are stored in **ChromaDB** with metadata attributes containing `meeting_id`, `title`, `date`, `participants`, and the `source` category (e.g. `transcript`, `summary`, `decision`, `action_item`). This metadata enables filtered queries and precise source citations.

### D. RAG Retrieval & Semantic Q&A Assistant
* **Purpose**: Answers user questions across all historical meetings with strict grounding and verifiable citations.
* **Technicals**:
  * **Similarity Query**: Embeds user query using BGE and retrieves the **Top 5** context chunks from ChromaDB based on Cosine Similarity.
  * **Source Attribution**: Maps retrieved chunks directly to their SQLite metadata.
  * **Context Grounding**: Combines retrieved blocks into a single prompt context, commanding the LLM to only answer based on the retrieved data.
  * **UI Matching Citations**: Displays responses inside a glowing purple chat container, featuring clickable source cards displaying the originating meeting's date, title, source type, matching similarity percentage, and the verbatim excerpt.

### E. Action & Decisions Tracker Dashboard
* **Purpose**: Consolidates deliverables from multiple meetings into a unified project management hub.
* **Technicals**:
  * **Decision Timelines**: Aggregates SQLite records of decisions across all sessions, displaying them as a chronological history logs.
  * **Interactive Action Checklist**: Syncs with the SQLite table, allowing the user to mark action items as `pending` or `completed`. Clicking a checkbox executes a `PUT /action-items/{id}` request, modifying the database row state in real time.

### F. AI-Powered Action Item Follow-up Reminder Composer
* **Purpose**: Automates team communications by drafting context-aware follow-up reminders.
* **Technicals**:
  * **Context Stitching**: When a user clicks **✉️ Remind** next to an action item, the API fetches the task, the assignee, and details of the originating meeting.
  * **Tailored Drafting**: Prompts LLaMA 3 to write two personalized communication drafts:
    1. **Slack Draft**: A short, friendly notification with emojis and username tags (e.g. `Hi @Bob...`).
    2. **Email Draft**: A professional template complete with an automated Subject line and a contextually relevant email body.

---

## 3. System Architecture & Data Flow

```
                 +---------------------------------------------+
                 |          User pastes raw transcript         |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |  Local NLP Summarization (BART / T5 / etc.) | -> (Local execution reduces API costs)
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |    OpenRouter LLaMA 3 (JSON Structuring)    |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |          Dual-Database Store Router         |
                 +-------------------+-------------------------+
                                     |
                  +------------------+------------------+
                  |                                     |
                  v                                     v
     +--------------------------+          +--------------------------+
     |   SQLite (meetings.db)   |          |    ChromaDB (Vector)     |
     |  Relational structured   |          |  Chunk embeddings using  |
     |   records & task states  |          |   BAAI/bge-small-en-v1.5 |
     +--------------------------+          +--------------------------+
```

### The Dual-Store Architecture Rationale (Crucial Interview Topic)
* **Question**: *"Why did you use both SQLite and ChromaDB instead of just storing everything in ChromaDB metadata?"*
* **Answer**: 
  1. **Separation of Concerns**: Databases should do what they are optimized for. SQLite handles structured relational queries, ACID transactions (e.g., toggling task status, grouping decisions), and joins. ChromaDB is optimized solely for high-speed, high-dimensional vector similarity searches.
  2. **Relational Integrity**: Toggling an action item's status from `pending` to `completed` is a write operation that requires strict consistency. Vector databases are traditionally eventually consistent and poor at transactional metadata updates. Using SQLite ensures task tracking is always accurate.
  3. **Metadata Limitations**: Querying and filtering metadata in vector databases can be slow and limited (e.g. executing complex joins or timeline queries). SQLite makes timeline and dashboard reporting trivial.

---

## 4. Deep Dive into Technical Components

### A. Embedding & Chunking Strategy
* **Text Splitter**: Character-based chunking with word boundary detection.
* **Chunk Size**: `500` characters; **Overlap**: `100` characters.
  * *Trade-off explanation*: 500 characters (~80 words) keeps context highly cohesive, preventing unrelated discussions from bleeding into the same embedding vector. The overlap of 100 characters ensures that sentences or thoughts split at chunk borders aren't lost in retrieval.
* **Embedding Model**: `BAAI/bge-small-en-v1.5` (via `sentence-transformers`).
  * *Why BGE?* BGE-small is a top-tier performer on the MTEB (Massive Text Embedding Benchmark) for retrieval tasks, has a lightweight footprint (384 dimensions vs OpenAI's 1536), runs efficiently on CPU, and supports query instructions (we prefix query inputs with *"Represent this sentence for searching relevant passages: "* for maximum retrieval accuracy).

### B. Prompt Engineering & JSON Extraction Guardrails
* **The Problem**: LLMs are non-deterministic and frequently output markdown blocks (e.g. \`\`\`json) or conversational text instead of raw JSON, which crashes standard backend parser routines.
* **Our Solution**: 
  1. **Strict Prompt Constraint**: Instructed LLaMA to return *ONLY* valid JSON, excluding comments (`//` or `#`) and markdown wrappers.
  2. **Defensive Post-Processing**: Created a regex cleaning utility (`clean_llm_output`) to strip leading markdown quotes and comments before attempting `json.loads()`.
  3. **Graceful Fallback**: Implemented try-except catch blocks that gracefully fall back to returning an empty schema dictionary rather than throwing 500 API errors.

### C. RAG Retrieval & Grounding Pipeline
* **Query Embedding**: The user's question is embedded on the fly.
* **Vector Search**: ChromaDB searches the collection and retrieves the **Top-K (5)** closest matching chunks based on Cosine Similarity.
* **Context Construction**: The chunks are aggregated with clear headers stating the originating meeting title, date, and participants.
* **Strict Grounding Prompt**: The prompt explicitly commands: *"Use ONLY the retrieved meeting context. If information is unavailable, say: 'I could not find relevant meeting records.'"* This mitigates hallucinations and restricts the model to factual grounds.

---

## 5. Behavioral & System Design Questions

### Q1: *"How would you scale this system if we had 100,000 meeting transcripts?"*
* **Vector Storage**: Move ChromaDB from an in-process persistent client to a distributed deployable vector database like **Pinecone**, **Qdrant**, or **Milvus**.
* **Embedding Computation**: Generate embeddings asynchronously. When a transcript is submitted, push it to a task queue (like **Celery** with **Redis**) so that embedding generation and database writes happen in the background without blocking the HTTP request thread.
* **Search Optimization**: Implement **Metadata Filtering** (e.g., filter searches by date range or participant list *before* running cosine similarity) to restrict the search space and speed up queries.

### Q2: *"Why did you use local summarization before passing context to the LLM?"*
* **Cost & Token Limits**: Raw transcripts can be tens of thousands of words. Sending them directly to commercial LLM APIs incurs high latency and heavy API usage costs. 
* **Hybrid Pipeline**: By using a small local model (like `BART-large-cnn`) locally on our backend, we compress the raw transcript down to a concise summary. We then send only the summarized text to the commercial LLM (LLaMA 3 via OpenRouter) for structured analysis. This reduces token costs by up to 80% while preserving crucial meeting outcomes.

---

## 6. Resume Bullet Points (Copy & Paste ready)

* **Dual-Store Architecture**: Architected a dual-database pipeline utilizing SQLite for relational ACID-compliant task tracking and ChromaDB vector store for semantic similarity search, securing sub-millisecond retrieval speeds.
* **Modular Backend Design**: Engineered a production-ready FastAPI backend with strict type hinting, structured logging, modular service design, and custom exception handlers.
* **Cost-Efficient Local NLP**: Built a hybrid summarization engine that compresses meeting transcripts using local transformers pipelines (BART/T5) before passing data to OpenRouter APIs, reducing commercial token costs by up to 80%.
* **RAG Pipeline Implementation**: Developed a RAG Q&A system leveraging `sentence-transformers` (`BAAI/bge-small-en-v1.5`) to chunk, embed, index, and retrieve cross-meeting knowledge with strict context grounding and source citations.
* **Interactive PM Workspace**: Designed a modern, dark-themed React + Tailwind dashboard highlighting meeting metadata repository, interactive action item tracking, and an AI-driven Slack/Email follow-up composer.
