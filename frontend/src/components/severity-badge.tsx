import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/cloudguard-api";

const STYLES: Record<Severity, string> = {
  critical: "bg-critical/15 text-critical ring-critical/40",
  high: "bg-high/15 text-high ring-high/40",
  medium: "bg-medium/15 text-medium ring-medium/40",
  low: "bg-low/15 text-low ring-low/40",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        STYLES[severity],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}
