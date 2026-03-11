# 📊 Sales Insight Automator
### Rabbitt AI · Cloud DevOps Engineering Sprint

> Upload a sales CSV or Excel file → AI generates an executive summary → Email delivered to your inbox.

[![CI](https://github.com/your-org/sales-insight-automator/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/sales-insight-automator/actions)

---

## 🔗 Live URLs

| Service | URL |
|---|---|
| **Frontend** | `https://sales-insight-automator.vercel.app` |
| **API** | `https://sales-insight-api.onrender.com` |
| **Swagger Docs** | `https://sales-insight-api.onrender.com/docs` |
| **ReDoc** | `https://sales-insight-api.onrender.com/redoc` |

---

## ⚡ Quick Start (Docker Compose)

### Prerequisites
- Docker & Docker Compose installed
- API keys (see `.env.example`)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/sales-insight-automator.git
cd sales-insight-automator

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys (Gemini, SendGrid, etc.)
nano backend/.env

# Frontend environment (optional for local dev)
cp frontend/.env.example frontend/.env
```

### 2. Spin up the entire stack

```bash
docker-compose up --build
```

| Service | Local URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

### 3. Test the flow

```bash
# Health check
curl http://localhost:8000/health

# Upload the sample data
curl -X POST http://localhost:8000/api/v1/analyze \
  -F "file=@sales_q1_2026.csv" \
  -F "recipient_email=you@example.com"
```

### Tear down
```bash
docker-compose down
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   User Browser                  │
│         React SPA (Vite + plain CSS)            │
└────────────────────┬────────────────────────────┘
                     │  POST /api/v1/analyze
                     │  multipart/form-data
┌────────────────────▼────────────────────────────┐
│           FastAPI Backend (Python 3.11)         │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Parser  │  │AI Engine │  │   Mailer     │  │
│  │pandas CSV│  │ Gemini   │  │SendGrid/SMTP │  │
│  │/Excel    │  │ (Groq fb)│  │              │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

**Data flow:**
1. User uploads `.csv` / `.xlsx` + email via the SPA
2. Backend validates file type, size, and email format
3. `services/parser.py` loads data into pandas, computes stats
4. `services/ai_engine.py` builds a structured prompt and calls Gemini 1.5 Flash (falls back to Groq Llama-3 if Gemini fails)
5. `services/mailer.py` renders an HTML email and delivers via SendGrid (falls back to SMTP)
6. A success response with a summary preview is returned to the frontend

---

## 🔒 Security Implementation

### 1. Rate Limiting (`slowapi`)
- **10 requests/minute per IP** on the `/analyze` endpoint
- Returns `HTTP 429` with retry-after on breach
- Configured via `@limiter.limit("10/minute")` decorator

### 2. File Validation (Whitelist Approach)
- Only `.csv`, `.xlsx`, `.xls` extensions are accepted — checked at the application layer before any processing
- **Max file size: 10 MB** — read into memory and size-checked before parsing
- Empty files are rejected with a 400 error

### 3. Input Sanitization
- Email addresses are stripped, lowercased, and length-capped at 254 characters (RFC 5321)
- Regex validation applied before any downstream use
- Filenames are never used as filesystem paths — content is processed from memory only

### 4. Security HTTP Headers (`middleware/security.py`)
Applied to every response via custom Starlette middleware:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'self'` |

### 5. CORS Policy
- Configured via FastAPI's `CORSMiddleware`
- In production: restrict `allow_origins` to your exact frontend domain

### 6. Non-Root Container
- The Docker image runs as a dedicated `appuser` (non-root)
- Multi-stage build ensures no build tools or credentials exist in the production layer

---

## 🐳 Docker Details

### Multi-Stage Builds
Both services use two-stage Dockerfiles:
- **Stage 1 (builder):** Installs all dependencies with build tools
- **Stage 2 (production):** Copies only the installed packages, resulting in lean images

### Image Sizes (approximate)
| Image | Size |
|---|---|
| Backend | ~230 MB |
| Frontend (nginx) | ~25 MB |

### Health Checks
Both services declare `HEALTHCHECK` instructions so Docker Compose waits for the backend to be healthy before starting the frontend.

---

## ⚙️ Configuration Reference

### `backend/.env.example`

```dotenv
# AI Engine (at least one required)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here       # fallback

# Email Delivery (at least one required)
SENDGRID_API_KEY=your_sendgrid_api_key_here

# OR SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

FROM_EMAIL=noreply@rabbittai.com
FROM_NAME=Rabbitt AI — Sales Insights

# App
PORT=8000
ENVIRONMENT=development
```

### `frontend/.env.example`

```dotenv
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Deployment Guide

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `.env.example` in the Render dashboard

### Frontend → Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend/`
3. Framework preset: **Vite**
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

---

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) triggers on **every PR to `main`**:

```
Pull Request → main
│
├── backend-ci
│   ├── Install Python deps
│   ├── Ruff lint check
│   └── FastAPI startup validation (health check)
│
├── backend-docker  (needs: backend-ci)
│   └── Docker build + layer cache
│
├── frontend-ci
│   ├── npm ci
│   ├── ESLint
│   └── Vite production build
│
└── frontend-docker  (needs: frontend-ci)
    └── Docker build + layer cache
```

All four jobs must pass before a PR can be merged.

---

## 📁 Project Structure

```
sales-insight-automator/
├── .github/
│   └── workflows/ci.yml          # GitHub Actions CI/CD
├── backend/
│   ├── main.py                   # FastAPI app + middleware setup
│   ├── routers/
│   │   └── upload.py             # POST /api/v1/analyze endpoint
│   ├── services/
│   │   ├── parser.py             # CSV/Excel parsing + stats
│   │   ├── ai_engine.py          # Gemini / Groq integration
│   │   └── mailer.py             # SendGrid / SMTP email delivery
│   ├── middleware/
│   │   └── security.py           # Security headers middleware
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Full SPA — upload form + states
│   │   ├── main.jsx
│   │   └── index.css             # Design system / theme
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml            # Full stack local environment
├── sales_q1_2026.csv             # Sample test data
└── README.md
```

---

## 🧪 API Reference

Full interactive documentation available at `/docs` (Swagger UI) and `/redoc`.

### `POST /api/v1/analyze`
Upload a sales file and trigger AI summary + email delivery.

**Request:** `multipart/form-data`
- `file` — `.csv` / `.xlsx` file (max 10MB)
- `recipient_email` — valid email address

**Response `200`:**
```json
{
  "success": true,
  "message": "Report generated and sent to exec@company.com",
  "summary_preview": "Executive Overview\n\nThe Q1 2026 dataset..."
}
```

**Error responses:** `400` (validation), `413` (file too large), `429` (rate limit), `500` (AI/email failure)

---

*Built by the Rabbitt AI Engineering team · Sprint duration: 3 hours*
