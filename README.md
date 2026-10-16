# STARKTECH Intelligence Platform — Backend Architecture & API Documentation

## Overview
A high-performance, modular Node.js/Express and SQLite backend tailored for the **STARKTECH** Technology Intelligence Platform (`STARKTECH.html`).

---

## Architecture Summary

- **Server Entrypoint**: [`server.js`](file:///c:/stark%20tech/server.js) — Express 5 server mounted with CORS, JSON body parser, HTTP request logging, static frontend serving, and graceful error handling.
- **Database & Persistence**: [`db.js`](file:///c:/stark%20tech/db.js) — Powered by Node.js 24's built-in `node:sqlite` (`DatabaseSync`), configured with WAL (Write-Ahead Logging) mode and foreign key constraints. Pre-seeds 100 enterprise users across 6 role archetypes, 18 real & synthetic technologies, 16 virtual laboratories, 8 core initiatives, skill trees, radar items, documentation records, and security audit logs.
- **Frontend Integration**: [`academy.html`](file:///c:/stark%20tech/academy.html) — Seamless asynchronous REST integration with course catalog, hands-on virtual labs, progress synchronization, and offline/fallback resilience.
- **Sentinel AI & Multi-Agent Engine Integration**: [`routes/sentinel.js`](file:///c:/stark%20tech/routes/sentinel.js) — Dual-mode intelligence gateway connected to the [`Multi-Agent Engine`](file:///c:/stark%20tech/Multi-Agent%20Engine).
  - **Students & Teachers**: Connects to the Hugging Face **Qwen 2.5 3B** model (`Qwen/Qwen2.5-Coder-3B-Instruct`) acting as an interactive Course AI Chatbot for curriculum guidance, lab assistance, concept breakdowns, and study roadmaps.
  - **Developers & Researchers**: Automatically routes and redirects to the original **SentinelAI Multi-Agent Security Workspace** (`/sentinel-ai/`), featuring the 4-agent pipeline (Planning, Research, Validation, Execution) and ChromaDB RAG.

---

## API Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate by Email or User ID with password verification and audit tracking.
- `GET /api/auth/me`: Fetch current active user session profile.
- `GET /api/auth/quick-picks`: Fetch demo accounts for 1-click role preview.
- `POST /api/auth/logout`: Revoke active session.

### 2. User Management (`/api/users`)
- `GET /api/users`: Filterable by `role`, `status`, or search query `q`.
- `GET /api/users/:id`: Individual user retrieval with skills array.
- `PATCH /api/users/:id/priority`: Update priority level (`P0` through `P3`) with automated audit log.
- `PATCH /api/users/:id`: Modify user department, skills, or status.
- `DELETE /api/users/:id`: Remove user with audit entry.

### 3. Technologies Catalog (`/api/technologies`)
- `GET /api/technologies`: Query by `real=1` (Real) or `real=0` (Synthetic), category (`cat`), status (`st`), or difficulty (`df`).
- `GET /api/technologies/:id`: Technology specification.
- `POST /api/technologies`: Register new technology stack.

### 4. Virtual Laboratories (`/api/labs`)
- `GET /api/labs`: Returns full lab roster with aggregate state metrics (`available`, `running`, `completed`, `credits`).
- `GET /api/labs/:id`: Lab details and recent submission histories.
- `POST /api/labs/:id/start`: Initialize virtual container sandbox environment.
- `POST /api/labs/:id/reset`: Re-initialize clean environment state.
- `POST /api/labs/:id/submit`: Submit lab code and terminal output; automatically marks lab completed and adds audit trail.
- `POST /api/labs/:id/execute`: Interactive shell command execution simulator (`python`, `test`, `status`, `help`).

### 5. Projects (`/api/projects`)
- `GET /api/projects`: List projects with progress percentage, priority, owner, and stage.
- `GET /api/projects/:id`: Project details.
- `POST /api/projects`: Register project initiative.
- `PATCH /api/projects/:id`: Update progress, status, or lead owner.

### 6. Learning & Skill Progression (`/api/learning`)
- `GET /api/learning`: Curriculum paths, certifications, and live skill tree.
- `PATCH /api/learning/tree/:skill`: Update mastery percentage for any skill.

### 7. Research Center (`/api/research`)
- `GET /api/research`: Grouped technology radar (`Adopt`, `Trial`, `Experimental`, `Research`, `Deprecated`), whitepapers, datasets, and running experiments.

### 8. Documentation (`/api/docs`)
- `GET /api/docs`: Architectural guides, API specs, and quickstart installation snippets.

### 9. Developer Portal (`/api/developer`)
- `GET /api/developer`: API keys, supported client SDKs, system builds, and request throughput.
- `POST /api/developer/rotate-key`: Key rotation with security log.

### 10. Platform Analytics (`/api/analytics`)
- `GET /api/analytics`: Live role distributions, lab completion %, course completion %, and overall metrics.

### 11. Security & Audit (`/api/security`)
- `GET /api/security/audit-logs`: Chronological log of sensitive operations (logins, priority changes, sandbox activities).
- `POST /api/security/audit-logs`: Append custom audit event.

### 12. Global Search (`/api/search`)
- `GET /api/search?q=...&role=...`: Unified lookup querying technologies, labs, projects, documentation, and user directory.

### 13. Sentinel AI & Multi-Agent Engine (`/api/sentinel` & `/sentinel-ai`)
- `GET /api/sentinel`: Service metadata, active LLM status (Local Ollama Qwen 2.5 / Hugging Face Qwen 2.5), and role-based routing map.
- `GET /api/sentinel/config`: Current provider, active Ollama model, and masked Hugging Face key.
- `POST /api/sentinel/config`: Update provider preference (`ollama` / `huggingface`) and Hugging Face API key.
- `POST /api/sentinel/chat`: Live Qwen 2.5 LLM chat endpoint for Students & Teachers. Executes real completions via local Ollama (`qwen2.5:0.5b` on GPU) or remote Hugging Face Router (`Qwen/Qwen2.5-Coder-3B-Instruct`), with natural conversational fallback.
- `GET /sentinel-ai/`: Serves the Multi-Agent Cybersecurity Workspace (Dashboard, Agent Analyst, Data Ingestion, Test Bench, Docs).
- `GET /api/status`, `POST /api/analyze`, `POST /api/test-bench`: Forwarding & proxy layer connecting the workspace UI to the Multi-Agent Engine.

---

---

## How to Run the Platform (Future Quick Start)

### Option 1: 1-Click Launch (Recommended for Windows)
Simply double-click the included batch launcher in the project root:
```
start-starktech.bat
```
This automatically verifies Node.js, detects Ollama GPU acceleration, starts the STARKTECH platform on port 3000 (which auto-spawns the Python Multi-Agent Engine on port 8000), and opens the app in your browser!

---

### Option 2: Terminal / Command Prompt

1. **(Optional) Start Local AI (Ollama)**:
   If you want offline GPU-accelerated responses with your local Qwen model:
   ```bash
   ollama run qwen2.5:0.5b
   ```
   *(If Ollama is not running, the platform will automatically connect to Hugging Face Cloud or built-in AI models seamlessly).*

2. **Start STARKTECH**:
   In the `c:\stark tech` folder, simply run:
   ```bash
   npm start
   ```
   *(Or for auto-reloading during development: `npm run dev`)*

3. **Open the Web Applications**:
   - 🎓 **Student & Teacher Portal (AI Course Chatbot)**:
     [http://localhost:3000/STARKTECH.html](http://localhost:3000/STARKTECH.html)
   - 🛡️ **Developer & Researcher Workspace (4-Agent Pipeline)**:
     [http://localhost:3000/sentinel-ai/](http://localhost:3000/sentinel-ai/)

---

## Verification & Testing

```bash
# Run core backend test suite (16 tests)
npm test

# Run Sentinel AI & Multi-Agent integration tests (10 tests)
npm run test:sentinel

# Run all test suites together (26 tests)
npm run test:all
```

