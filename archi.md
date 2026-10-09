# RepoMedic System Architecture

RepoMedic is an AI-powered code quality and repository health analysis platform. It combines static AST/regex scanning, dependency auditing, duplicate code detection, and LLM-driven architectural reviews (OpenAI GPT-4o) on cloned GitHub repositories, backed by **Supabase PostgreSQL** and **NextAuth**.

---

## 1. High-Level Architecture

```mermaid
graph TD
    Client["Client (Browser)"] <--> |HTTPS / Next.js SSR & API| NextApp["Next.js 16 App Server"]
    
    subgraph "External Integrations"
        GitHub["GitHub OAuth & API"]
        OpenAI["OpenAI API (GPT-4o)"]
        Supabase["Supabase PostgreSQL (Pooler:5432)"]
    end
    
    subgraph "Local Execution Engine"
        GitEngine["Simple-Git Clone Engine"]
        StaticScanner["Static Analyzer (AST / Heuristics)"]
        FileTreeGen["File Tree & Duplicate Scanner"]
        DiskStore["Temporary Storage (temp_repos/)"]
    end

    NextApp <--> |OAuth / Clone Repos| GitHub
    NextApp <--> |Code Review Prompt| OpenAI
    NextApp <--> |Pooled SQL (pg)| Supabase
    NextApp --> GitEngine
    GitEngine --> DiskStore
    DiskStore --> StaticScanner
    DiskStore --> FileTreeGen
```

---

## 2. Core Components

### 2.1. Presentation Layer (Next.js 16 App Router & React 19)
- **Landing Page ([src/app/page.tsx](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/app/page.tsx))**: Authentication gate and feature preview.
- **Dashboard ([src/app/dashboard/page.tsx](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/app/dashboard/page.tsx))**:
  - Fetches the user's GitHub repositories using their OAuth access token.
  - Allows triggering new analyses.
  - Monitors background analysis jobs with an active polling mechanism (`/api/analyze/job/[jobId]`).
- **Analysis View ([src/app/dashboard/analysis/[id]/page.tsx](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/app/dashboard/analysis/%5Bid%5D/page.tsx))**:
  - Server-rendered data hydration from Supabase.
  - [ResultClient.tsx](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/app/dashboard/analysis/%5Bid%5D/ResultClient.tsx): Interactive multi-tab breakdown:
    - **Overview**: Health score dials, language distribution, and metric highlights.
    - **File Tree**: Visual file structure with unused/duplicate indicators.
    - **Cleanup**: Downloadable shell script (`cleanup_<repo>.sh`) to delete orphaned files.
    - **Dependencies**: Used vs. unused dependency audit.
    - **Duplicates**: Code block duplication detection with file references.
    - **Organizer**: Proposed repository refactoring structure.
    - **Issues**: Categorized severity breakdown (high, medium, low).
- **History View ([src/app/dashboard/history/page.tsx](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/app/dashboard/history/page.tsx))**: Timeline of past audits with health scores and deletion capabilities.

---

### 2.2. API & Routing Layer

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | `GET`, `POST` | NextAuth GitHub OAuth handler |
| `/api/analyze` | `POST` | Queues repository analysis and dispatches background pipeline |
| `/api/analyze/job/[jobId]` | `GET` | Polling endpoint for job step (`step`) and percentage (`progress`) |
| `/api/analyze/[id]` | `GET`, `DELETE` | Retrieves analysis data or removes past report |
| `/api/analyze/[id]/ai` | `POST` | Triggers OpenAI GPT-4o contextual code audit |
| `/api/analyze/history` | `GET` | Lists previous analyses for the authenticated user |

---

### 2.3. Analysis Engine ([src/lib/analyzer.ts](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/lib/analyzer.ts))

The analysis pipeline processes repositories in sequential, non-blocking steps:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant API as /api/analyze
    participant Queue as Job Queue (Supabase)
    participant Worker as Pipeline Worker
    participant GitHub as GitHub Git
    participant AI as OpenAI (GPT-4o)

    User->>API: POST /api/analyze { owner, repo, branch }
    API->>Queue: Job.create (status: 'pending')
    API-->>User: 202 Accepted { jobId }
    API-)Worker: Dispatch background pipeline (next/server `after`)
    
    loop Polling every 2s
        User->>Queue: GET /api/analyze/job/:jobId
        Queue-->>User: { status, step, progress }
    end

    Worker->>GitHub: Clone repo to temp_repos/:id
    Worker->>Worker: 1. Scan file structure & filter binaries
    Worker->>Worker: 2. Detect languages & distribution
    Worker->>Worker: 3. Detect unreferenced / unused files
    Worker->>Worker: 4. Audit dependencies (manifest vs imports)
    Worker->>Worker: 5. Detect duplicate code blocks (hashing)
    Worker->>Worker: 6. Calculate weighted health score
    Worker->>Worker: 7. Build interactive file tree & organizer plan
    Worker->>Queue: Analysis.create + Job.update(status: 'done', analysisId)
    Worker->>Worker: Cleanup temp_repos directory (async delayed)
    
    User->>API: GET /dashboard/analysis/:analysisId
    API-->>User: Render full report

    opt On-Demand AI Summary
        User->>API: POST /api/analyze/:id/ai
        API->>AI: Generate architectural assessment & action plan
        AI-->>API: Summary & recommendations
        API-->>User: Updated AI Insights
    end
```

---

## 3. Data Architecture (Supabase / PostgreSQL)

Database connection is established through the **Supabase Connection Pooler** (Session mode on port `5432` / Transaction mode on port `6543`), managed via `pg.Pool` in [src/lib/db.ts](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/lib/db.ts).

### 3.1. Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ JOBS : "executes"
    USERS ||--o{ ANALYSES : "owns"
    JOBS |o--o| ANALYSES : "yields"

    USERS {
        text id PK
        bigint github_id UK
        text login
        text name
        text avatar_url
        text html_url
        int public_repos
        int followers
        text access_token
        timestamptz created_at
        timestamptz updated_at
    }

    JOBS {
        text id PK
        text user_id FK
        text owner
        text repo
        text branch
        text status
        text step
        int progress
        text error
        text analysis_id
        timestamptz created_at
        timestamptz updated_at
    }

    ANALYSES {
        text id PK
        text user_id FK
        bigint repo_id
        text repo_name
        text repo_full_name
        text branch
        timestamptz analyzed_at
        int duration
        text status
        text job_step
        int job_progress
        text job_error
        jsonb stats
        jsonb languages
        jsonb file_tree
        jsonb unused_files
        jsonb dependencies
        jsonb duplicates
        jsonb issues
        jsonb vulnerabilities
        jsonb health_score
        jsonb organizer_suggestion
        text ai_summary
        jsonb suggestions
        timestamptz created_at
        timestamptz updated_at
    }
```

### 3.2. Data Models & Mapping
- **[User](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/lib/models/User.ts)**: Handles GitHub OAuth profiles and stores user credentials and tokens.
- **[Job](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/lib/models/Job.ts)**: Manages async job queue states (`pending` ➔ `running` ➔ `done` / `error`).
- **[Analysis](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/lib/models/Analysis.ts)**: Stores structured scan metrics, issues, and security vulnerabilities using JSONB columns with a fluent query builder (`.find()`, `.sort()`, `.limit()`, `.lean()`).

---

## 4. Vulnerability & Security Scanner Utility ([src/lib/vulnerabilityScanner.ts](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/lib/vulnerabilityScanner.ts))

RepoMedic includes a built-in Static Application Security Testing (SAST) and credential detection engine that audits the codebase line-by-line during the analysis pipeline.

### 4.1. Security Check Categories

| Category | CWE | Severity | Example Patterns Detected |
|---|:---:|:---:|---|
| **Secret Leaks** | CWE-798 | Critical / High | OpenAI keys (`sk-proj-...`), GitHub PATs (`ghp_...`, `github_pat_...`), AWS Access/Secret keys, Supabase Service Role keys, Stripe keys, Private RSA/SSH keys, Hardcoded database URIs with credentials |
| **Command Injection** | CWE-78 | Critical | Dynamic template interpolation in Node.js `exec()` / `execSync()`, Python `os.system()` and `subprocess(..., shell=True)` |
| **SQL Injection** | CWE-89 | High | Unescaped string concatenation in raw SQL queries (`SELECT ... + id` or template strings) |
| **Code Execution** | CWE-95 | Critical / High | `eval()`, `new Function()`, Python `exec()` |
| **Insecure Deserialization** | CWE-502 | Critical / High | Python `pickle.loads()`, unconstrained `yaml.load()` without SafeLoader, `node-serialize` |
| **Cross-Site Scripting (XSS)** | CWE-79 | Medium | React `dangerouslySetInnerHTML`, raw `innerHTML` assignments, `document.write()` |
| **Path Traversal** | CWE-22 | High | Direct use of request parameters in `fs.readFile()` without path normalization |
| **Cryptographic Weaknesses** | CWE-327 / CWE-338 | Medium | Broken hashes (MD5 / SHA-1) for security signatures, `Math.random()` used for token generation |
| **Security Misconfiguration** | CWE-295 / CWE-319 | Medium / Low | `rejectUnauthorized: false` (SSL bypass), unencrypted remote HTTP API endpoints |
| **Dependency Vulnerabilities** | CWE-1104 / CWE-506 | Critical / High | Known compromised or deprecated packages (`node-serialize`, `event-stream`, `flatmap-stream`, `request`) |

### 4.2. Secret Masking & Safe Reporting
- When hardcoded secrets are detected, the analyzer automatically masks the sensitive tokens (e.g., `sk-proj-ab****456`) so sensitive production credentials are never revealed in plain text in logs or client-rendered dashboards.
- Placeholders, mock templates (`your-api-key`, `sk-xxx`), and test fixtures are automatically filtered to prevent false alarms.

---

## 5. Health Score Calculation Methodology

The overall health score ($0 - 100$) is dynamically computed across six key dimensions in [src/lib/analyzer.ts](file:///c:/Users/Pushkar%20Mhatre/Desktop/Work/repomedic-ai/src/lib/analyzer.ts):

| Dimension | Weight | Description |
|---|:---:|---|
| **Security & Vulnerabilities** | 25% | Deductions for Critical (-30), High (-15), Medium (-6), and Low (-2) vulnerabilities |
| **File Cleanliness** | 20% | Penalty for orphaned, temporary, or unimported files |
| **Dependency Hygiene** | 20% | Percentage of declared dependencies actively utilized |
| **Duplicate Code** | 15% | Ratio of duplicate code blocks vs total file lines |
| **Architecture & Structure** | 10% | Presence of `.gitignore`, testing directory, and standard layout |
| **Documentation** | 10% | Presence and quality of README and docs |

---

## 6. Security & Isolation

- **Token Security**: GitHub personal access tokens are stored in the database and utilized solely for user-authorized Git cloning and repo listing.
- **Ephemeral Clones**: Cloned repositories are isolated in `temp_repos/<uuid>` and deleted with `rimraf` after scanning completes.
- **Database Safety**: All SQL operations use parameterized queries (`$1, $2, ...`) against Supabase to eliminate SQL injection risks.
- **Environment Isolation**: Production credentials and secrets are managed via environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `GITHUB_CLIENT_SECRET`, `OPENAI_API_KEY`).

