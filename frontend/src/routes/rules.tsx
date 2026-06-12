import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, AlertTriangle, BookOpen } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { SeverityBadge } from "@/components/severity-badge";
import { fetchRules, API_BASE, type RuleInfo } from "@/lib/cloudguard-api";

const CATEGORIES = ["all", "general", "aws", "k8s", "docker"] as const;
const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rule catalogue — CloudGuard Lite" },
      {
        name: "description",
        content: "Browse all 44 CloudGuard security rules by severity and category.",
      },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["rules", category],
    queryFn: () => fetchRules(category),
    retry: 1,
  });

  const rules = useMemo(() => {
    const all = data?.rules ?? [];
    return all.filter((r) => {
      if (severity !== "all" && r.severity !== severity) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !r.name.toLowerCase().includes(s) &&
          !r.description.toLowerCase().includes(s) &&
          !r.id.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [data, severity, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    (data?.rules ?? []).forEach((r) => {
      c[r.severity] = (c[r.severity] ?? 0) + 1;
    });
    return c;
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-6 pt-12 pb-10">
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Rule catalogue
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {data?.total ?? 44} security rules, ready to enforce.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Every rule includes a description, a remediation step, and a category. Filter to
            see what CloudGuard will check before you run a scan.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["critical", "high", "medium", "low"] as const).map((s) => (
            <div key={s} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <SeverityBadge severity={s} />
                <span className="text-2xl font-display font-semibold">{counts[s] ?? 0}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 mb-5 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, description, or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <FilterGroup
            label="Category"
            options={CATEGORIES as unknown as string[]}
            value={category}
            onChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}
          />
          <FilterGroup
            label="Severity"
            options={SEVERITIES as unknown as string[]}
            value={severity}
            onChange={(v) => setSeverity(v as (typeof SEVERITIES)[number])}
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading rules…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-destructive">Couldn't load rules</div>
              <div className="text-muted-foreground">
                Backend at <code className="font-mono">{API_BASE}</code> is unreachable.
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              Showing {rules.length} of {data?.total ?? 0} rules
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rules.map((r, i) => (
                <RuleCard key={r.id} rule={r} index={i} />
              ))}
            </div>
            {rules.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No rules match your filters.
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="inline-flex rounded-md border border-border bg-background p-0.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition ${
              value === o
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function RuleCard({ rule, index }: { rule: RuleInfo; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.02 }}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={rule.severity} />
            <span className="font-mono text-[11px] text-muted-foreground">{rule.id}</span>
            <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {rule.category}
            </span>
          </div>
          <h3 className="mt-2 font-semibold text-sm">{rule.name}</h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
          <div className="mt-3 flex items-start gap-2 text-xs">
            <BookOpen className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
            <span className="text-foreground/90">{rule.fix}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
