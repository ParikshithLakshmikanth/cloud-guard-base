import { motion } from "framer-motion";
import { Download, Copy, Check, FileWarning, Sparkles, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { ScanResult } from "@/lib/cloudguard-api";
import { SeverityBadge } from "@/components/severity-badge";
import { Button } from "@/components/ui/button";

const SEV_ORDER: Array<"critical" | "high" | "medium" | "low"> = ["critical", "high", "medium", "low"];
const SEV_TEXT: Record<string, string> = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
};

export function ScanResultCard({ result, index = 0 }: { result: ScanResult; index?: number }) {
  const [copied, setCopied] = useState(false);

  const formatPercent = (value: number | undefined) =>
    Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : "N/A";

  const scoreColor =
    result.score >= 85
      ? "text-success"
      : result.score >= 60
      ? "text-medium"
      : result.score >= 30
      ? "text-high"
      : "text-critical";

  const copyClean = async () => {
    await navigator.clipboard.writeText(result.clean_config);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadClean = () => {
    const blob = new Blob([result.clean_config], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clean_${result.filename}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-border/70">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">File</div>
          <div className="font-mono text-sm mt-0.5">{result.filename}</div>
          <div className="text-xs text-muted-foreground mt-1">{result.total_lines} lines analysed</div>
        </div>

        <div className="flex items-center gap-3">
          {SEV_ORDER.map((s) => (
            <div key={s} className="text-center">
              <div className={`text-lg font-semibold ${result.counts[s] ? SEV_TEXT[s] : "text-muted-foreground"}`}>
                {result.counts[s] ?? 0}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s}</div>
            </div>
          ))}
          <div className="ml-3 pl-4 border-l border-border text-center">
            <div className={`text-2xl font-display font-semibold ${scoreColor}`}>{result.score}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">score</div>
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="p-5">
        {result.findings.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div className="text-sm">
              <div className="font-medium text-success">No issues detected</div>
              <div className="text-muted-foreground">This file passed all 44 rule checks.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-medium" />
              Findings ({result.findings.length})
            </h3>
            <div className="space-y-2">
              {result.findings.map((f, i) => (
                <div
                  key={`${f.rule_id}-${f.line}-${i}`}
                  className="rounded-lg border border-border bg-muted p-4"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-medium text-sm">{f.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{f.rule_id}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                      line {f.line}
                    </span>
                  </div>
                  {f.matched_text && (
                    <pre className="mt-2.5 overflow-x-auto rounded-md bg-muted border border-border/60 p-2.5 text-[11px] font-mono text-muted-foreground">
                      {f.matched_text}
                    </pre>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  <div className="mt-2 flex items-start gap-2 text-xs">
                    <span className="text-success font-semibold shrink-0">FIX</span>
                    <span className="text-foreground/90">{f.fix}</span>
                  </div>
                  {typeof f.confidence === "number" && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      SLM confidence {formatPercent(f.confidence)}
                      {f.similar_rule && <span>· similar to {f.similar_rule}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLM suggestions */}
        {result.slm_suggestions && result.slm_suggestions.length > 0 && (
          <div className="mt-5 rounded-lg border border-primary/25 bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              SLM rule suggestions
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rules your config most resembles, even where regex didn't match.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.slm_suggestions.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border px-2.5 py-1 text-xs"
                >
                  <span className="font-mono text-muted-foreground">{s.id}</span>
                  <span>{s.name}</span>
                  <span className="text-primary font-mono">{formatPercent(s.score)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Clean config */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Cleaned config</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyClean}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadClean}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </div>
          <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted p-4 text-[12px] font-mono leading-relaxed">
            {result.clean_config}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
