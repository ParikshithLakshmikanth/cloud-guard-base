import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileCode2,
  Loader2,
  Play,
  X,
  AlertTriangle,
  Plug,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { scanConfig, uploadFiles, API_BASE, type ScanResult } from "@/lib/cloudguard-api";
import { ScanResultCard } from "@/components/scan-result-card";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner — CloudGuard Lite" },
      {
        name: "description",
        content: "Paste a config or drop files to scan for cloud misconfigurations.",
      },
    ],
  }),
  component: ScannerPage,
});

const SAMPLE = `# Try a sample — Terraform with multiple issues
resource "aws_s3_bucket" "logs" {
  bucket        = "company-logs"
  public_access = true
  encryption    = false
}

provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

resource "aws_security_group" "open" {
  ingress {
    cidr = "0.0.0.0/0"
  }
}
`;

type Mode = "paste" | "upload";

function ScannerPage() {
  const [mode, setMode] = useState<Mode>("paste");
  const [config, setConfig] = useState("");
  const [filename, setFilename] = useState("config.yaml");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalFindings = useMemo(
    () => results.reduce((acc, r) => acc + r.findings.length, 0),
    [results]
  );

  const runPasteScan = useCallback(async () => {
    if (!config.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await scanConfig(config, filename || "config.yaml");
      setResults([r]);
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message}. Is the backend running on ${API_BASE}?`
          : "Scan failed"
      );
    } finally {
      setLoading(false);
    }
  }, [config, filename]);

  const runUploadScan = useCallback(async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { results: r } = await uploadFiles(files);
      setResults(r);
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message}. Is the backend running on ${API_BASE}?`
          : "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  }, [files]);

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).slice(0, 10);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      const merged = [...prev];
      for (const f of arr) {
        if (!seen.has(f.name + f.size)) merged.push(f);
      }
      return merged.slice(0, 10);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-6 pt-12 pb-10">
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Scanner</span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Run a config through 44 rules + SLM enrichment.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Paste a single file or drop up to 10 at once. Supported: YAML, JSON, Terraform,
            HCL, Dockerfile, .cfg, .conf, .txt.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="inline-flex rounded-lg border border-border bg-card p-1 mb-5">
          {(["paste", "upload"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "paste" ? "Paste config" : "Upload files"}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <AnimatePresence mode="wait">
            {mode === "paste" ? (
              <motion.div
                key="paste"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <label className="text-xs text-muted-foreground">Filename</label>
                  <input
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono w-56 focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="config.yaml"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConfig(SAMPLE);
                      setFilename("main.tf");
                    }}
                    className="text-xs"
                  >
                    Load sample
                  </Button>
                </div>
                <textarea
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                  placeholder="# Paste Terraform, YAML, JSON, Dockerfile, or any IaC config here..."
                  className="w-full h-80 rounded-lg border border-input bg-muted p-4 font-mono text-[13px] leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                  spellCheck={false}
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">
                    {config.split("\n").length} lines · {config.length} chars
                  </span>
                  <Button onClick={runPasteScan} disabled={loading || !config.trim()} size="lg">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Scan config
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 h-64 rounded-xl border-2 border-dashed cursor-pointer transition ${
                    dragOver
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted hover:border-primary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm font-medium">Drop files here or click to browse</div>
                  <div className="text-xs text-muted-foreground">
                    Up to 10 files · YAML, JSON, TF, HCL, Dockerfile, .cfg
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                </div>

                {files.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {files.map((f, i) => (
                      <li
                        key={f.name + i}
                        className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCode2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-mono text-xs truncate">{f.name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">
                    {files.length} file{files.length === 1 ? "" : "s"} queued
                  </span>
                  <Button onClick={runUploadScan} disabled={loading || files.length === 0} size="lg">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Scan {files.length || ""} file{files.length === 1 ? "" : "s"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-destructive">Couldn't reach the backend</div>
              <div className="text-muted-foreground mt-0.5">{error}</div>
              <div className="text-muted-foreground mt-2 flex items-center gap-1.5">
                <Plug className="h-3.5 w-3.5" />
                Run <code className="font-mono text-foreground">uvicorn main:app --reload --port 8000</code>
                {" "}in <code className="font-mono text-foreground">backend/</code>, or set
                {" "}<code className="font-mono text-foreground">VITE_API_URL</code>.
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <section className="mt-10 space-y-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">
                Results <span className="text-muted-foreground font-normal">({results.length} file{results.length === 1 ? "" : "s"}, {totalFindings} finding{totalFindings === 1 ? "" : "s"})</span>
              </h2>
            </div>
            <div className="space-y-5">
              {results.map((r, i) => (
                <ScanResultCard key={r.filename + i} result={r} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
