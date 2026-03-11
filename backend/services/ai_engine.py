import os
import json
import httpx
import pandas as pd
import logging

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Fallback: Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"


def _build_prompt(df: pd.DataFrame, stats: dict, filename: str) -> str:
    """Build a structured prompt for the LLM."""
    sample_rows = df.head(10).to_csv(index=False)

    numeric_summary = json.dumps(stats.get("numeric_summary", {}), indent=2)
    categorical_summary = json.dumps(stats.get("categorical_summary", {}), indent=2)

    total_revenue = stats.get("total_revenue", "N/A")
    total_units = stats.get("total_units", "N/A")

    return f"""You are a senior business analyst preparing an executive briefing for the leadership team.

You have been given sales data from the file: **{filename}**

## Dataset Overview
- Total records: {stats['total_rows']}
- Columns: {', '.join(stats['columns'])}
- Total Revenue: {total_revenue}
- Total Units Sold: {total_units}

## Sample Data (first 10 rows)
{sample_rows}

## Numeric Column Statistics
{numeric_summary}

## Categorical Breakdown
{categorical_summary}

---

Write a professional executive summary (300-400 words) that includes:
1. **Executive Overview** — A 2-3 sentence high-level summary of overall performance
2. **Key Highlights** — Top 3-5 notable findings (best performing region, product, trend)
3. **Areas of Concern** — Any underperformance, anomalies, or risks
4. **Strategic Recommendations** — 2-3 actionable next steps for leadership
5. **Data Quality Notes** — Brief note on data completeness or any caveats

Write in a confident, concise, boardroom-ready tone. Use specific numbers where available.
Do not use excessive markdown — use plain professional prose with clear section headers."""


async def generate_summary(df: pd.DataFrame, stats: dict, filename: str) -> str:
    """Generate AI summary using Gemini (primary) or Groq (fallback)."""
    prompt = _build_prompt(df, stats, filename)

    if GEMINI_API_KEY:
        try:
            return await _call_gemini(prompt)
        except Exception as e:
            logger.warning(f"Gemini failed, trying Groq fallback: {e}")

    if GROQ_API_KEY:
        try:
            return await _call_groq(prompt)
        except Exception as e:
            logger.error(f"Groq also failed: {e}")
            raise

    # If no API key configured — return a structured mock (demo mode)
    logger.warning("No AI API key configured — returning mock summary for demo.")
    return _mock_summary(stats, filename)


async def _call_gemini(prompt: str) -> str:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _call_groq(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(GROQ_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _mock_summary(stats: dict, filename: str) -> str:
    revenue = stats.get("total_revenue", 0)
    units = stats.get("total_units", 0)
    rows = stats.get("total_rows", 0)

    return f"""Executive Overview

The dataset "{filename}" contains {rows} sales records. Total recorded revenue stands at ${revenue:,.2f} with {units} units sold across the reporting period.

Key Highlights

Revenue performance shows strong activity in top-performing segments. The data captures a diverse range of product categories and regional activity. Key drivers appear concentrated in high-unit-price categories, contributing disproportionately to total revenue.

Areas of Concern

A review of status distribution reveals a non-trivial portion of orders with "Cancelled" status, which may indicate fulfillment or demand forecasting issues. Further investigation into cancellation patterns by region or product is recommended.

Strategic Recommendations

1. Prioritize inventory and sales efforts in the highest-revenue regions and product lines identified in this dataset.
2. Investigate root causes for cancellations to reduce revenue leakage and improve fulfillment reliability.
3. Expand data collection to include customer acquisition cost and margin data for a more complete performance picture.

Data Quality Notes

The dataset appears structurally complete. No critical missing values were detected in key columns. For production reporting, ensure date ranges are consistently defined and all regional codes are standardized.

— Generated by Sales Insight Automator (Demo Mode)"""
