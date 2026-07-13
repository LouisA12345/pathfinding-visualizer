'use client';

import { useState } from 'react';
import { Info, Menu } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { LeftPanelTab } from '@/types';
import { AlgorithmPicker } from '@/components/controls/AlgorithmPicker';
import { TemplatesPanel } from '@/components/panels/TemplatesPanel';
import { GeneratorPanel } from '@/components/panels/GeneratorPanel';
import { DrawToolsPanel } from '@/components/panels/DrawToolsPanel';
import { ComparePanel } from '@/components/panels/ComparePanel';
import { CommunityPanel } from '@/components/panels/CommunityPanel';
import { StatsSidebarPanel } from '@/components/panels/StatsSidebarPanel';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { AlgorithmInfoPanel } from '@/components/panels/AlgorithmInfoPanel';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const TABS: { id: LeftPanelTab; label: string }[] = [
  { id: 'algorithms', label: 'Algo' },
  { id: 'templates', label: 'Templates' },
  { id: 'generator', label: 'Generate' },
  { id: 'draw', label: 'Draw' },
  { id: 'compare', label: 'Compare' },
  { id: 'community', label: 'Community' },
  { id: 'stats', label: 'Stats' },
  { id: 'settings', label: 'Settings' },
];

export function MobileMenu() {
  const activeLeftTab = useUiStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useUiStore((s) => s.setActiveLeftTab);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5 lg:hidden">
      <Dialog open={toolsOpen} onOpenChange={setToolsOpen}>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Open tools menu" onClick={() => setToolsOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogTitle>Tools</DialogTitle>
          <Tabs value={activeLeftTab} onValueChange={(v) => setActiveLeftTab(v as LeftPanelTab)}>
            <TabsList className="w-full flex-wrap">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="text-xs">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollArea className="mt-3 h-[60vh]">
              <TabsContent value="algorithms">
                <AlgorithmPicker />
              </TabsContent>
              <TabsContent value="templates">
                <TemplatesPanel />
              </TabsContent>
              <TabsContent value="generator">
                <GeneratorPanel />
              </TabsContent>
              <TabsContent value="draw">
                <DrawToolsPanel />
              </TabsContent>
              <TabsContent value="compare">
                <ComparePanel />
              </TabsContent>
              <TabsContent value="community">
                <CommunityPanel />
              </TabsContent>
              <TabsContent value="stats">
                <StatsSidebarPanel />
              </TabsContent>
              <TabsContent value="settings">
                <SettingsPanel />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Algorithm info" onClick={() => setInfoOpen(true)}>
          <Info className="h-4 w-4" />
        </Button>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogTitle>Algorithm info</DialogTitle>
          <ScrollArea className="h-[70vh]">
            <AlgorithmInfoPanel />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
