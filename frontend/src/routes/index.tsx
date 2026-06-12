import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ScanLine,
  FileCode2,
  Sparkles,
  Lock,
  Cloud,
  Container,
  Boxes,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CloudGuard Lite — AI cloud config vulnerability scanner" },
      {
        name: "description",
        content:
          "Catch hardcoded secrets, public S3 buckets, open ports, and 40+ other cloud config flaws in seconds.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: ScanLine,
    title: "44 built-in rules",
    body: "Curated detectors for AWS, Kubernetes, Docker, and general IaC across critical, high, medium, and low severities.",
  },
  {
    icon: Sparkles,
    title: "SLM-enriched findings",
    body: "A TF-IDF Small Language Model adds confidence scores and surfaces rules your config most resembles.",
  },
  {
    icon: FileCode2,
    title: "Auto-cleaned configs",
    body: "Every scan returns a sanitized version of your file with placeholders swapped in for risky values.",
  },
  {
    icon: Lock,
    title: "Runs entirely on your machine",
    body: "Point the UI at your local FastAPI backend — no telemetry, no upload to a third party.",
  },
];

const TARGETS = [
  { icon: Cloud, label: "AWS / IAM" },
  { icon: Container, label: "Dockerfiles" },
  { icon: Boxes, label: "Kubernetes" },
  { icon: FileCode2, label: "Terraform / HCL" },
];

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[1100px] -z-10 rounded-full bg-primary/10 blur-[120px]" />

        <div className="mx-auto max-w-7xl px-6 pt-20 pb-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px] shadow-primary" />
              v3.0 · TF-IDF SLM engine online
            </span>

            <h1 className="mt-6 max-w-3xl text-5xl sm:text-6xl font-semibold tracking-tight">
              Ship cloud configs that
              <span className="block bg-gradient-to-r from-primary via-primary/90 to-success bg-clip-text text-transparent">
                don't leak your keys.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
              CloudGuard Lite scans Terraform, Kubernetes, Docker, and YAML files for
              misconfigurations and hardcoded secrets — then hands you a clean version,
              fix instructions, and AI-ranked rule suggestions.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold glow-teal">
                <Link to="/scanner">
                  Start scanning <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-sm">
                <Link to="/rules">Browse the rule catalogue</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              {TARGETS.map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <t.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{t.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mock scan card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-2 shadow-2xl shadow-primary/5">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-medium/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                  <span className="ml-3 font-mono text-xs text-muted-foreground">main.tf · scan</span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">score 42 / 100</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-border">
                <pre className="p-5 text-[12px] leading-relaxed font-mono text-muted-foreground overflow-x-auto">
{`resource "aws_s3_bucket" "data" {
  bucket        = "internal-logs"
  public_access = true
  encryption    = false
}

provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEX"
}`}
                </pre>
                <div className="p-5 space-y-3">
                  <FindingRow sev="critical" name="Public S3 Bucket" line={3} />
                  <FindingRow sev="critical" name="Hardcoded Access Token" line={8} />
                  <FindingRow sev="critical" name="Hardcoded Secret Key" line={9} />
                  <FindingRow sev="high" name="Unencrypted Storage" line={4} />
                  <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Clean config generated
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Everything you need to harden a config in one pass.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built on FastAPI with a deterministic regex engine plus a lightweight SLM that
            scores how closely your file matches each rule's training corpus.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-10 sm:p-14">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
                <ShieldCheck className="h-4 w-4" /> Ready when you are
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Paste a config or drop a folder.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Results stream back in under a second with severity-ranked findings and a
                cleaned-up copy you can commit.
              </p>
            </div>
            <Button asChild size="lg" className="h-12 px-6 self-start md:self-auto">
              <Link to="/scanner">Open the scanner <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FindingRow({ sev, name, line }: { sev: "critical" | "high"; name: string; line: number }) {
  const color = sev === "critical" ? "text-critical" : "text-high";
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full bg-current ${color}`} />
        <span className="font-medium">{name}</span>
      </div>
      <span className="font-mono text-muted-foreground">L{line}</span>
    </div>
  );
}
