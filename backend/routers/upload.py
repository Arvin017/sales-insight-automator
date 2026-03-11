from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, EmailStr
import logging

from services.parser import parse_file
from services.ai_engine import generate_summary
from services.mailer import send_email

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class AnalyzeResponse(BaseModel):
    success: bool
    message: str
    summary_preview: str | None = None


def validate_file_extension(filename: str) -> str:
    """Whitelist-based file extension validation."""
    import os
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Accepted types: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    return ext


def sanitize_email(email: str) -> str:
    """Basic email sanitization."""
    return email.strip().lower()[:254]  # RFC 5321 max length


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Upload & Analyze Sales Data",
    description="""
Upload a `.csv` or `.xlsx` sales data file along with a recipient email address.

The endpoint will:
1. **Parse** the uploaded file into structured data
2. **Generate** an AI-powered executive summary using Google Gemini
3. **Email** the formatted report to the specified address
4. **Return** a preview of the summary

**Rate limit**: 10 requests per minute per IP address.
    """,
    responses={
        200: {"description": "Analysis complete, email sent successfully"},
        400: {"description": "Invalid file type, malformed data, or bad email"},
        413: {"description": "File exceeds 10MB limit"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal server error (AI or email service failure)"},
    },
)
@limiter.limit("10/minute")
async def analyze_sales_data(
    request: Request,
    file: UploadFile = File(..., description="Sales data file (.csv or .xlsx, max 10MB)"),
    recipient_email: str = Form(..., description="Email address to receive the summary"),
):
    """
    Core endpoint: parse sales file → AI summary → send email.
    """
    # --- Input validation ---
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = validate_file_extension(file.filename)
    sanitized_email = sanitize_email(recipient_email)

    # Simple email format check
    import re
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", sanitized_email):
        raise HTTPException(status_code=400, detail="Invalid email address format.")

    # Read file with size guard
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds the 10MB limit.")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    logger.info(f"Processing file '{file.filename}' ({len(contents)} bytes) for {sanitized_email}")

    # --- Parse data ---
    try:
        df, stats = parse_file(contents, ext)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # --- AI summary ---
    try:
        summary = await generate_summary(df, stats, file.filename)
    except Exception as e:
        logger.error(f"AI engine error: {e}")
        raise HTTPException(status_code=500, detail="AI summary generation failed. Please try again.")

    # --- Send email ---
    try:
        await send_email(
            recipient=sanitized_email,
            subject=f"📊 Sales Insight Report — {file.filename}",
            summary=summary,
            stats=stats,
        )
    except Exception as e:
        logger.error(f"Email delivery error: {e}")
        raise HTTPException(status_code=500, detail="Summary generated but email delivery failed.")

    logger.info(f"Successfully processed and delivered report to {sanitized_email}")

    return AnalyzeResponse(
        success=True,
        message=f"Report generated and sent to {sanitized_email}",
        summary_preview=summary[:500] + "..." if len(summary) > 500 else summary,
    )


@router.get(
    "/health",
    summary="API Health Check",
    description="Returns service health status.",
    tags=["Health"],
)
async def api_health():
    return {"status": "ok", "api_version": "v1"}
