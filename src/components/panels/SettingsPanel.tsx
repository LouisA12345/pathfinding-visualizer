'use client';

import { useId } from 'react';
import { useUiStore } from '@/store/uiStore';
import { VisualizerSettings } from '@/types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div>
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsPanel() {
  const settings = useUiStore((s) => s.settings);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const resetSettings = useUiStore((s) => s.resetSettings);

  const set = <K extends keyof VisualizerSettings>(key: K, value: VisualizerSettings[K]) =>
    updateSettings({ [key]: value } as Partial<VisualizerSettings>);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Default animation speed — {settings.animationSpeed} steps/s</Label>
        <Slider
          min={1}
          max={300}
          step={1}
          value={[settings.animationSpeed]}
          onValueChange={(v) => set('animationSpeed', Array.isArray(v) ? v[0] : v)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Node size — {settings.nodeSize}px</Label>
        <Slider
          min={6}
          max={40}
          step={1}
          value={[settings.nodeSize]}
          onValueChange={(v) => set('nodeSize', Array.isArray(v) ? v[0] : v)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Weighted A* heuristic weight — {settings.heuristicWeight.toFixed(1)}</Label>
        <Slider
          min={1}
          max={5}
          step={0.1}
          value={[settings.heuristicWeight]}
          onValueChange={(v) => set('heuristicWeight', Array.isArray(v) ? v[0] : v)}
        />
      </div>

      <Separator />

      <ToggleRow
        label="Diagonal movement"
        description="Allow 8-directional movement instead of 4."
        checked={settings.diagonalMovement}
        onCheckedChange={(v) => set('diagonalMovement', v)}
      />
      <ToggleRow
        label="Corner cutting"
        description="Allow diagonal moves past adjacent wall corners."
        checked={settings.cornerCutting}
        onCheckedChange={(v) => set('cornerCutting', v)}
      />

      <Separator />

      <ToggleRow label="Show frontier" checked={settings.showFrontier} onCheckedChange={(v) => set('showFrontier', v)} />
      <ToggleRow label="Show visited" checked={settings.showVisited} onCheckedChange={(v) => set('showVisited', v)} />
      <ToggleRow
        label="Show coordinates"
        checked={settings.showCoordinates}
        onCheckedChange={(v) => set('showCoordinates', v)}
      />
      <ToggleRow label="Show costs" checked={settings.showCosts} onCheckedChange={(v) => set('showCosts', v)} />
      <ToggleRow
        label="Show heuristics"
        description="Label each cell with its estimated distance to the goal (h) — the number A*-family algorithms use to steer their search."
        checked={settings.showHeuristics}
        onCheckedChange={(v) => set('showHeuristics', v)}
      />

      <Separator />

      <ToggleRow
        label="Reduce motion"
        description="Minimize UI transitions and animations."
        checked={settings.reduceMotion}
        onCheckedChange={(v) => set('reduceMotion', v)}
      />
      <ToggleRow
        label="High contrast"
        description="Higher-contrast grid color palette."
        checked={settings.highContrast}
        onCheckedChange={(v) => set('highContrast', v)}
      />
      <ToggleRow
        label="Sound effects"
        checked={settings.soundEffects}
        onCheckedChange={(v) => set('soundEffects', v)}
      />

      <Button variant="outline" size="sm" className="w-full" onClick={resetSettings}>
        Reset to defaults
      </Button>
    </div>
  );
}
