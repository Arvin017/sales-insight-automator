import io
import pandas as pd
from typing import Tuple


def parse_file(contents: bytes, ext: str) -> Tuple[pd.DataFrame, dict]:
    """
    Parse CSV or Excel file bytes into a DataFrame and compute basic stats.
    Returns (df, stats_dict).
    """
    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        elif ext in (".xlsx", ".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise ValueError(f"Unsupported extension: {ext}")
    except Exception as e:
        raise ValueError(f"Could not read file: {e}")

    if df.empty:
        raise ValueError("The uploaded file contains no data rows.")

    # Strip whitespace from column names
    df.columns = [str(c).strip() for c in df.columns]

    # Build stats
    stats = _compute_stats(df)
    return df, stats


def _compute_stats(df: pd.DataFrame) -> dict:
    """Compute summary statistics from a sales DataFrame."""
    stats: dict = {
        "total_rows": len(df),
        "columns": list(df.columns),
    }

    # Numeric column summaries
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    stats["numeric_summary"] = {}
    for col in numeric_cols:
        stats["numeric_summary"][col] = {
            "sum": round(float(df[col].sum()), 2),
            "mean": round(float(df[col].mean()), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
        }

    # Categorical breakdowns (top 10 per column)
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    stats["categorical_summary"] = {}
    for col in cat_cols:
        vc = df[col].value_counts().head(10).to_dict()
        stats["categorical_summary"][col] = {str(k): int(v) for k, v in vc.items()}

    # Try to detect revenue / units columns by name
    for candidate in ["Revenue", "revenue", "Total_Revenue", "Sales"]:
        if candidate in df.columns:
            stats["total_revenue"] = round(float(df[candidate].sum()), 2)
            break

    for candidate in ["Units_Sold", "units_sold", "Quantity", "Units"]:
        if candidate in df.columns:
            stats["total_units"] = int(df[candidate].sum())
            break

    return stats
