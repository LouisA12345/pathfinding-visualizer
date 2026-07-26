'use client';

import { getAlgorithm } from '@/lib/algorithms/registry';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { formatElapsedWithSkip } from '@/hooks/useLiveStats';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PronounceButton } from '@/components/panels/PronounceButton';

export function AlgorithmInfoPanel() {
  const selectedId = useAlgorithmStore((s) => s.selectedId);
  const result = useAlgorithmStore((s) => s.result);
  const currentStepIndex = useAlgorithmStore((s) => s.currentStepIndex);
  const elapsedMs = useAlgorithmStore((s) => s.elapsedMs);
  const wasSkipped = useAlgorithmStore((s) => s.wasSkipped);
  const def = getAlgorithm(selectedId);

  if (!def) return null;

  const currentStep = result?.steps[currentStepIndex];
  const activeLine = currentStep?.pseudocodeLine ? currentStep.pseudocodeLine - 1 : -1;

  return (
    <div className="space-y-4 text-sm">
      <div>
        {/* Long names (e.g. "IDA* (Iterative Deepening A*)") plus a badge
            can exceed a narrow phone-width dialog; without flex-wrap that
            overflowed horizontally, which used to just need a scroll but,
            since ScrollArea's viewport now clips overflow-x instead of
            scrolling it, silently cut the badge/pronunciation off the
            right edge entirely. Wrapping avoids the overflow at the
            source instead of relying on being able to scroll to it. */}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{def.name}</h2>
          <Badge variant="outline" className="text-[10px]">
            {def.meta.category}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <PronounceButton name={def.name} spokenName={def.meta.spokenName} />
          <span className="font-mono text-xs text-muted-foreground italic">{def.meta.pronunciation}</span>
        </div>
        <p className="mt-1.5 text-muted-foreground">{def.meta.description}</p>
      </div>

      <div className="rounded-md border bg-muted/30 p-2.5">
        <h3 className="mb-1 text-xs font-medium text-muted-foreground">In plain terms</h3>
        <p className="text-xs leading-relaxed">{def.meta.intuition}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Time complexity</p>
          <p className="font-mono">{def.meta.timeComplexity}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Space complexity</p>
          <p className="font-mono">{def.meta.spaceComplexity}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Optimal</p>
          <p>{def.meta.optimal ? 'Yes' : 'No'}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Complete</p>
          <p>{def.meta.complete ? 'Yes' : 'No'}</p>
        </div>
        <div className="col-span-2 rounded-md border p-2">
          <p className="text-muted-foreground">Time taken (start to end, this run)</p>
          <p className="font-mono">{result ? formatElapsedWithSkip(elapsedMs, wasSkipped) : '—'}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">History</h3>
        <p className="text-xs leading-relaxed">{def.meta.history}</p>
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">How it works</h3>
        <p className="text-xs leading-relaxed">{def.meta.howItWorks}</p>
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">
          Pseudocode {result ? '(highlighted live)' : ''}
        </h3>
        <pre className="overflow-x-auto rounded-md border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
          {def.meta.pseudocode.map((line, i) => (
            <div
              key={i}
              className={cn('rounded px-1', i === activeLine && 'bg-primary/20 text-foreground font-medium')}
            >
              {line}
            </div>
          ))}
        </pre>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-3">
        <div>
          <h3 className="mb-1 text-xs font-medium text-emerald-500">Advantages</h3>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {def.meta.advantages.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-medium text-red-500">Disadvantages</h3>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {def.meta.disadvantages.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-medium text-sky-500">Use cases</h3>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {def.meta.useCases.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-medium text-amber-500">Real-world applications</h3>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {def.meta.realWorldApplications.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">How it compares to similar algorithms</h3>
        <p className="text-xs leading-relaxed">{def.meta.comparisons}</p>
      </div>
    </div>
  );
}
