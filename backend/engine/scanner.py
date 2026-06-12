"""
CloudGuard Lite — Line-by-line config scanner with line number detection
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import List, Optional
from .rules import RULES, Rule


@dataclass
class FindingResult:
    rule_id: str
    name: str
    severity: str
    category: str
    line_numbers: List[int]
    matched_text: str
    fix: str
    description: str
    confidence: float = 1.0   # filled by SLM engine


@dataclass
class ScanResult:
    filename: str
    findings: List[FindingResult]
    score: int
    total_lines: int

    @property
    def counts(self):
        c = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for f in self.findings:
            if f.severity in c:
                c[f.severity] += 1
        return c


def _calc_score(findings: List[FindingResult]) -> int:
    weights = {"critical": 25, "high": 15, "medium": 8, "low": 3}
    deduction = sum(weights.get(f.severity, 0) for f in findings)
    return max(0, 100 - deduction)


def scan_config(text: str, filename: str = "config") -> ScanResult:
    """
    Scan a config text string.
    Returns a ScanResult with per-finding line numbers.
    """
    lines = text.splitlines()
    total_lines = len(lines)
    findings: List[FindingResult] = []
    seen_rule_ids: set = set()

    for rule in RULES:
        pattern = rule.compile()
        matched_lines: List[int] = []
        matched_texts: List[str] = []

        # Full-text test first (fast path)
        if not pattern.search(text):
            continue

        # Line-by-line to get exact line numbers
        for line_no, line in enumerate(lines, start=1):
            m = pattern.search(line)
            if m:
                matched_lines.append(line_no)
                matched_texts.append(line.strip())

        # Multiline patterns (e.g., R037 Kind+key span) — fall back to full match
        if not matched_lines:
            m = pattern.search(text)
            if m:
                # Approximate: find which line the match starts on
                start_pos = m.start()
                line_no = text[:start_pos].count("\n") + 1
                matched_lines = [line_no]
                matched_texts = [m.group(0).strip()[:80]]

        if rule.id not in seen_rule_ids:
            seen_rule_ids.add(rule.id)
            findings.append(FindingResult(
                rule_id=rule.id,
                name=rule.name,
                severity=rule.severity,
                category=rule.category,
                line_numbers=matched_lines,
                matched_text="; ".join(matched_texts[:3]),  # max 3 samples
                fix=rule.fix,
                description=rule.description,
                confidence=1.0,
            ))

    score = _calc_score(findings)
    return ScanResult(
        filename=filename,
        findings=findings,
        score=score,
        total_lines=total_lines,
    )


def generate_clean_config(text: str, findings: List[FindingResult]) -> str:
    """Apply safe placeholder replacements to produce a clean config."""
    from .rules import RULE_MAP
    cleaned = text
    replacements = [
        (r'("?password"?\s*[:=]\s*)["\']?[^\s"\'\\n,}]+["\']?', r'\g<1>"<USE_ENV_VAR>"'),
        (r'("?api[_-]?key"?\s*[:=]\s*)["\']?[^\s"\'\\n,}]+["\']?', r'\g<1>"<USE_ENV_VAR>"'),
        (r'("?secret[_-]?key"?\s*[:=]\s*)["\']?[^\s"\'\\n,}]+["\']?', r'\g<1>"<USE_ENV_VAR>"'),
        (r'("?access[_-]?token"?\s*[:=]\s*)["\']?[^\s"\'\\n,}]+["\']?', r'\g<1>"<USE_ENV_VAR>"'),
        (r'("?admin[_-]?password"?\s*[:=]\s*)["\']?[^\s"\'\\n,}]+["\']?', r'\g<1>"<USE_ENV_VAR>"'),
        (r'("?public[_-]?access"?\s*[:=]\s*)true', r'\g<1>false'),
        (r'("?encrypt(?:ion|ed)?"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?ssl"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?tls"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?logging"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?mfa(?:[_-]?enabled)?"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?monitoring"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?firewall"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?backup"?\s*[:=]\s*)["\']?false["\']?', r'\g<1>true'),
        (r'("?debug"?\s*[:=]\s*)["\']?true["\']?', r'\g<1>false'),
        (r'("?cidr"?\s*[:=]\s*)["\']?0\.0\.0\.0\/0["\']?', r'\g<1>"10.0.0.0/24"'),
        (r'("?user"?\s*[:=]\s*)["\']?root["\']?', r'\g<1>"<IAM_USER>"'),
    ]
    for pat, repl in replacements:
        cleaned = re.sub(pat, repl, cleaned, flags=re.IGNORECASE)
    return cleaned
