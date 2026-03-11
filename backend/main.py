from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import logging

from routers import upload
from middleware.security import SecurityHeadersMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Sales Insight Automator API",
    description="""
## Sales Insight Automator

Upload CSV/Excel sales data and receive an AI-generated executive summary directly to your inbox.

### Features
- 📊 **File Upload**: Supports `.csv` and `.xlsx` files (max 10MB)
- 🤖 **AI Analysis**: Powered by Google Gemini for professional narrative summaries
- 📧 **Email Delivery**: Instant delivery via SendGrid/SMTP
- 🔒 **Secured**: Rate limiting, CORS, input validation & sanitization

### Security
- Rate limiting: 10 requests/minute per IP
- File type validation (whitelist approach)
- Input sanitization on all fields
- Security headers on all responses
    """,
    version="1.0.0",
    contact={"name": "Rabbitt AI Engineering", "email": "dev@rabbittai.com"},
    license_info={"name": "MIT"},
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Security headers
app.add_middleware(SecurityHeadersMiddleware)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({duration:.3f}s)")
    return response

# Routers
app.include_router(upload.router, prefix="/api/v1", tags=["Sales Insights"])


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint — health check."""
    return {"status": "ok", "service": "Sales Insight Automator", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "service": "sales-insight-automator",
        "version": "1.0.0",
        "docs": "/docs",
    }
