'use client';

import { cn } from '@/lib/utils';

export interface BarDatum {
  id: string;
  label: string;
  value: number;
  disabledReason?: string;
}

interface BenchmarkBarChartProps {
  title: string;
  data: BarDatum[];
  valueFormatter: (value: number) => string;
  /** Lower is better (e.g. runtime, visited) vs higher is better — determines which bar gets the "best" highlight. */
  lowerIsBetter?: boolean;
}

export function BenchmarkBarChart({ title, data, valueFormatter, lowerIsBetter = true }: BenchmarkBarChartProps) {
  const enabled = data.filter((d) => !d.disabledReason);
  const maxValue = Math.max(1, ...enabled.map((d) => d.value));
  const bestId = enabled.length
    ? enabled.reduce((best, d) => (lowerIsBetter ? (d.value < best.value ? d : best) : d.value > best.value ? d : best)).id
    : null;

  return (
    <div className="rounded-lg border p-3">
      <h3 className="mb-2.5 text-sm font-medium">{title}</h3>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.id} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-xs text-muted-foreground" title={d.label}>
              {d.label}
            </span>
            <div className="relative h-4 flex-1 rounded-sm bg-muted/40">
              {!d.disabledReason && (
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-r-sm',
                    d.id === bestId ? 'bg-emerald-500' : 'bg-primary/60'
                  )}
                  style={{ width: `${Math.max(2, (d.value / maxValue) * 100)}%` }}
                />
              )}
            </div>
            <span className="w-20 shrink-0 text-right text-xs tabular-nums text-foreground">
              {d.disabledReason ?? valueFormatter(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
