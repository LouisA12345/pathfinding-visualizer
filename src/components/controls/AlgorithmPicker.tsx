'use client';

import { ALGORITHMS, shortcutKeyForIndex } from '@/lib/algorithms/registry';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const CATEGORY_LABEL: Record<string, string> = {
  uninformed: 'Uninformed',
  informed: 'Informed',
  bidirectional: 'Bidirectional',
  'grid-specific': 'Grid-specific',
};

export function AlgorithmPicker() {
  const selectedId = useAlgorithmStore((s) => s.selectedId);
  const selectAlgorithm = useAlgorithmStore((s) => s.selectAlgorithm);

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-xs text-muted-foreground">
        Every algorithm is numbered below; press keys 1-9 to quick-switch to the first nine.
      </p>
      {ALGORITHMS.map((def, i) => {
        const active = def.id === selectedId;
        const shortcut = shortcutKeyForIndex(i);
        return (
          <button
            key={def.id}
            type="button"
            onClick={() => selectAlgorithm(def.id)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left transition-colors',
              active
                ? 'border-primary/40 bg-primary/10'
                : 'border-transparent hover:border-border hover:bg-muted'
            )}
            aria-pressed={active}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{def.name}</span>
              <kbd
                className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground"
                title={shortcut ? `Press ${shortcut} to select` : `Position ${i + 1} in this list (no keyboard shortcut)`}
              >
                {i + 1}
              </kbd>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {CATEGORY_LABEL[def.meta.category]}
              </Badge>
              {def.meta.optimal && (
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                  Optimal
                </Badge>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
