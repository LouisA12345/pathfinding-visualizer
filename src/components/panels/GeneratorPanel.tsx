'use client';

import { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { useMazeStore } from '@/store/mazeStore';
import { useGridStore } from '@/store/gridStore';
import { useUiStore } from '@/store/uiStore';
import { generateAndApplyMaze, loadSavedMaze, saveCurrentMaze } from '@/lib/engine/mazeActions';
import { exportMazeToFile, importMazeFromFile } from '@/lib/persistence/mazeSerialization';
import { exportGridAsPng, exportGridAsSvg } from '@/lib/persistence/exportImage';
import { MAZE_GENERATORS } from '@/lib/maze/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export function GeneratorPanel() {
  const selectedGeneratorId = useMazeStore((s) => s.selectedGeneratorId);
  const setSelectedGenerator = useMazeStore((s) => s.setSelectedGenerator);
  const intensity = useMazeStore((s) => s.intensity);
  const setIntensity = useMazeStore((s) => s.setIntensity);
  const savedMazes = useMazeStore((s) => s.savedMazes);
  const deleteSavedMaze = useMazeStore((s) => s.deleteSavedMaze);
  const [mazeName, setMazeName] = useState('My maze');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generator = MAZE_GENERATORS.find((g) => g.id === selectedGeneratorId);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Generator</Label>
        <Select value={selectedGeneratorId} onValueChange={(v) => v && setSelectedGenerator(v)}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAZE_GENERATORS.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {generator && <p className="text-xs text-muted-foreground">{generator.description}</p>}
      </div>

      {selectedGeneratorId === 'random-walls' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Wall density — {(intensity * 100).toFixed(0)}%</Label>
          <Slider
            min={0.05}
            max={0.5}
            step={0.01}
            value={[intensity]}
            onValueChange={(v) => setIntensity(Array.isArray(v) ? v[0] : v)}
          />
        </div>
      )}

      <Button className="w-full" onClick={() => generateAndApplyMaze()}>
        Generate maze
      </Button>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs">Save current maze</Label>
        <div className="flex gap-1.5">
          <Input value={mazeName} onChange={(e) => setMazeName(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" onClick={() => saveCurrentMaze(mazeName || 'Untitled')}>
            Save
          </Button>
        </div>
      </div>

      {savedMazes.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Saved mazes</Label>
          <ScrollArea className="h-40 rounded-md border">
            <div className="space-y-1 p-1.5">
              {savedMazes.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-1 rounded-md px-2 py-1 hover:bg-muted">
                  <button
                    type="button"
                    className="flex-1 truncate text-left text-xs"
                    onClick={() => loadSavedMaze(m.id)}
                    title={m.name}
                  >
                    {m.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete ${m.name}`}
                    onClick={() => deleteSavedMaze(m.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-xs">Import / export</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const { grid } = useGridStore.getState();
              exportMazeToFile(grid, mazeName || 'maze');
            }}
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const { grid } = useGridStore.getState();
              const { theme, settings } = useUiStore.getState();
              exportGridAsPng(grid, theme, settings, mazeName || 'maze');
            }}
          >
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const { grid } = useGridStore.getState();
              const { theme, settings } = useUiStore.getState();
              exportGridAsSvg(grid, theme, settings, mazeName || 'maze');
            }}
          >
            SVG
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              const grid = await importMazeFromFile(file);
              useGridStore.getState().setGrid(grid);
            } catch {
              // Silently ignore malformed files; a toast/error surface can be added later.
            }
          }}
        />
      </div>
    </div>
  );
}
