const RAW = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
export const API_BASE = RAW.replace(/\/$/, "");

export type Severity = "critical" | "high" | "medium" | "low";

export interface Finding {
  rule_id: string;
  name: string;
  severity: Severity;
  category: string;
  line: number;
  matched_text?: string;
  fix: string;
  description: string;
  // SLM enrichment (optional)
  confidence?: number;
  similar_rule?: string;
}

export interface ScanResult {
  filename: string;
  total_lines: number;
  score: number;
  counts: Record<string, number>;
  findings: Finding[];
  slm_suggestions?: Array<{ id: string; name: string; score: number }>;
  clean_config: string;
}

export interface RuleInfo {
  id: string;
  name: string;
  severity: Severity;
  category: string;
  description: string;
  fix: string;
}

export async function scanConfig(config: string, filename = "config.yaml"): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, filename }),
  });
  if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
  return res.json();
}

export async function uploadFiles(files: File[]): Promise<{ results: ScanResult[] }> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function fetchRules(category?: string): Promise<{ total: number; rules: RuleInfo[] }> {
  const qs = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${API_BASE}/api/rules${qs}`);
  if (!res.ok) throw new Error(`Rules fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; slm_ready: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("offline");
  return res.json();
}
