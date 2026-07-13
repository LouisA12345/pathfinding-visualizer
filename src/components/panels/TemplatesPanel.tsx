'use client';

import { MAZE_GENERATORS } from '@/lib/maze/registry';
import { useMazeStore } from '@/store/mazeStore';
import { generateAndApplyMaze } from '@/lib/engine/mazeActions';
import { cn } from '@/lib/utils';

export function TemplatesPanel() {
  const selectedGeneratorId = useMazeStore((s) => s.selectedGeneratorId);
  const setSelectedGenerator = useMazeStore((s) => s.setSelectedGenerator);

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-xs text-muted-foreground">
        Click a template to apply it instantly to the current grid size.
      </p>
      {MAZE_GENERATORS.map((gen) => {
        const active = gen.id === selectedGeneratorId;
        return (
          <button
            key={gen.id}
            type="button"
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left transition-colors',
              active ? 'border-primary/40 bg-primary/10' : 'border-transparent hover:border-border hover:bg-muted'
            )}
            onClick={() => {
              setSelectedGenerator(gen.id);
              generateAndApplyMaze(gen.id);
            }}
          >
            <div className="text-sm font-medium">{gen.name}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{gen.description}</p>
          </button>
        );
      })}
    </div>
  );
}
