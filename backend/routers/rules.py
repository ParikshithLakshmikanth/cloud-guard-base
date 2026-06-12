"""GET /api/rules — return full rule catalogue"""
from fastapi import APIRouter, Query
from typing import Optional
from engine.rules import RULES

router = APIRouter()


@router.get("/rules")
async def get_rules(category: Optional[str] = Query(None)):
    rules = RULES
    if category:
        rules = [r for r in rules if r.category == category.lower()]
    return {
        "total": len(rules),
        "rules": [
            {
                "id": r.id,
                "name": r.name,
                "severity": r.severity,
                "category": r.category,
                "description": r.description,
                "fix": r.fix,
            }
            for r in rules
        ]
    }
