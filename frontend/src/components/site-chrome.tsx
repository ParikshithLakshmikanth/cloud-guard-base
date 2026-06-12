import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchHealth, API_BASE } from "@/lib/cloudguard-api";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/scanner", label: "Scanner" },
  { to: "/rules", label: "Rules" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then(() => !cancelled && setOnline(true))
      .catch(() => !cancelled && setOnline(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40 group-hover:ring-primary transition">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold tracking-tight">CloudGuard</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Lite Scanner</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-md transition",
                  active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
          >
            <Activity className="h-3.5 w-3.5" />
            API Docs
          </a>
          <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-mono">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                online === null && "bg-muted-foreground animate-pulse",
                online === true && "bg-success shadow-[0_0_8px] shadow-success",
                online === false && "bg-destructive"
              )}
            />
            <span className="text-muted-foreground">
              {online === null ? "checking" : online ? "online" : "offline"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} CloudGuard Lite — AI-assisted cloud config scanner.</span>
        <span className="font-mono">v3.0.0 · TF-IDF SLM enrichment</span>
      </div>
    </footer>
  );
}
