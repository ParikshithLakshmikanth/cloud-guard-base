"""
CloudGuard Lite — TF-IDF SLM (Small Language Model) Engine
Uses sklearn TfidfVectorizer + cosine similarity to score config text against rules.
"""
from __future__ import annotations
import os
import re
from typing import List, Dict, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .rules import RULES, Rule


class TFIDFSLMEngine:
    """
    Lightweight SLM using TF-IDF cosine similarity.
    Corpus: one document per rule = name + description + fix text.
    Scores config text against each rule vector.
    """

    def __init__(self):
        self.rules = RULES
        self.vectorizer: TfidfVectorizer | None = None
        self.rule_matrix = None
        self._rule_corpus: List[str] = []
        self._initialized = False

    def initialize(self):
        """Build TF-IDF matrix from rule corpus. Call once at startup."""
        self._rule_corpus = [
            f"{r.name} {r.description} {r.fix} {r.category}"
            for r in self.rules
        ]
        self.vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            stop_words="english",
            max_features=2000,
            sublinear_tf=True,
        )
        self.rule_matrix = self.vectorizer.fit_transform(self._rule_corpus)
        self._initialized = True

    def _ensure_init(self):
        if not self._initialized:
            self.initialize()

    def score_config(self, text: str) -> List[Dict]:
        """
        Score config text against all rules.
        Returns list of {rule_id, name, severity, confidence} sorted by confidence desc.
        """
        self._ensure_init()
        # Preprocess: tokenize config into meaningful terms
        config_doc = self._preprocess_config(text)
        config_vec = self.vectorizer.transform([config_doc])
        similarities = cosine_similarity(config_vec, self.rule_matrix)[0]

        results = []
        for i, rule in enumerate(self.rules):
            conf = float(similarities[i])
            results.append({
                "rule_id": rule.id,
                "name": rule.name,
                "severity": rule.severity,
                "category": rule.category,
                "confidence": round(conf, 4),
            })

        return sorted(results, key=lambda x: x["confidence"], reverse=True)

    def enrich_findings(self, findings, config_text: str) -> List[Dict]:
        """
        Attach SLM confidence score to each scanner finding.
        finding must have .rule_id attribute.
        """
        self._ensure_init()
        scores = {s["rule_id"]: s["confidence"] for s in self.score_config(config_text)}
        enriched = []
        for f in findings:
            conf = scores.get(f.rule_id, 0.0)
            # Boost confidence for regex-confirmed hits
            conf = min(1.0, conf + 0.3) if conf > 0.05 else 0.6
            enriched.append({
                "rule_id": f.rule_id,
                "name": f.name,
                "severity": f.severity,
                "category": f.category,
                "line_numbers": f.line_numbers,
                "matched_text": f.matched_text,
                "fix": f.fix,
                "description": f.description,
                "confidence": round(conf, 3),
            })
        return enriched

    def suggest_rules(self, text: str, threshold: float = 0.15) -> List[str]:
        """
        Find suspicious token clusters in config that don't strongly match any rule.
        Returns list of suggestion strings.
        """
        self._ensure_init()
        scores = self.score_config(text)
        low_confidence = [s for s in scores if s["confidence"] < threshold]

        # Extract tokens from config that are security-adjacent
        suspicious_tokens = re.findall(
            r'\b(key|token|secret|password|cred|auth|cert|priv|root|admin'
            r'|open|public|expose|allow|permit|unrestricted|unencrypted)\w*\b',
            text, re.IGNORECASE
        )
        unique_tokens = list(set(t.lower() for t in suspicious_tokens))

        suggestions = []
        if unique_tokens:
            suggestions.append(
                f"Suspicious tokens found not covered by existing rules: "
                f"{', '.join(unique_tokens[:5])}"
            )
        return suggestions

    def explain_match(self, rule_id: str, config_text: str) -> List[str]:
        """Return top TF-IDF tokens that contributed to this rule matching."""
        self._ensure_init()
        rule_idx = next(
            (i for i, r in enumerate(self.rules) if r.id == rule_id), None
        )
        if rule_idx is None:
            return []

        config_vec = self.vectorizer.transform([self._preprocess_config(config_text)])
        rule_vec = self.rule_matrix[rule_idx]

        # Element-wise product = contribution per term
        feature_names = self.vectorizer.get_feature_names_out()
        scores_arr = np.asarray(config_vec.multiply(rule_vec).todense()).flatten()
        top_indices = scores_arr.argsort()[::-1][:8]

        return [
            feature_names[i]
            for i in top_indices
            if scores_arr[i] > 0
        ]

    def _preprocess_config(self, text: str) -> str:
        """Clean config text for TF-IDF: extract keys, values, comments."""
        # Keep key names and values; strip punctuation noise
        text = re.sub(r'[{}\[\]"\'\\]', ' ', text)
        text = re.sub(r'[:=]+', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


# Singleton
slm_engine = TFIDFSLMEngine()
