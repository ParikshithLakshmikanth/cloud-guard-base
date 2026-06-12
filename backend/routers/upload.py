"""POST /api/upload — scan multiple uploaded files"""
import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from engine.scanner import scan_config, generate_clean_config
from engine.slm import slm_engine

router = APIRouter()
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".yaml", ".yml", ".json", ".tf", ".hcl", ".txt", ".cfg", ".conf", ""}


@router.post("/upload")
async def upload(files: List[UploadFile] = File(...)):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Max 10 files at a time.")

    results = []
    for file in files:
        # Extension check
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS and file.filename.lower() not in ("dockerfile",):
            continue

        # Read content
        content_bytes = await file.read()
        try:
            text = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = content_bytes.decode("latin-1", errors="replace")

        # Save temp file (optional, for audit)
        tmp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}_{file.filename}")
        async with aiofiles.open(tmp_path, "w", encoding="utf-8") as f:
            await f.write(text)

        # Scan
        result = scan_config(text, file.filename or "unknown")
        enriched = slm_engine.enrich_findings(result.findings, text)
        suggestions = slm_engine.suggest_rules(text)
        clean = generate_clean_config(text, result.findings)

        results.append({
            "filename": result.filename,
            "total_lines": result.total_lines,
            "score": result.score,
            "counts": result.counts,
            "findings": enriched,
            "slm_suggestions": suggestions,
            "clean_config": clean,
        })

        # Cleanup temp file
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    return {"results": results}
