"""POST /api/scan — scan a single config text"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from engine.scanner import scan_config, generate_clean_config
from engine.slm import slm_engine

router = APIRouter()


class ScanRequest(BaseModel):
    config: str
    filename: Optional[str] = "config.yaml"


@router.post("/scan")
async def scan(req: ScanRequest):
    result = scan_config(req.config, req.filename)
    enriched = slm_engine.enrich_findings(result.findings, req.config)
    suggestions = slm_engine.suggest_rules(req.config)
    clean = generate_clean_config(req.config, result.findings)

    return {
        "filename": result.filename,
        "total_lines": result.total_lines,
        "score": result.score,
        "counts": result.counts,
        "findings": enriched,
        "slm_suggestions": suggestions,
        "clean_config": clean,
    }
