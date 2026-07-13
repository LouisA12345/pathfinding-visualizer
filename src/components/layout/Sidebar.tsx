'use client';

import { BarChart3, LayoutTemplate, PenTool, Route, Rows3, Settings as SettingsIcon, Trophy, Wand2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TABS: { id: LeftPanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'algorithms', label: 'Algorithms', icon: <Route className="h-4 w-4" /> },
  { id: 'templates', label: 'Maze templates', icon: <LayoutTemplate className="h-4 w-4" /> },
  { id: 'generator', label: 'Maze generator', icon: <Wand2 className="h-4 w-4" /> },
  { id: 'draw', label: 'Drawing tools', icon: <PenTool className="h-4 w-4" /> },
  { id: 'compare', label: 'Compare mode', icon: <Rows3 className="h-4 w-4" /> },
  { id: 'community', label: 'Community mazes & leaderboards', icon: <Trophy className="h-4 w-4" /> },
  { id: 'stats', label: 'Statistics', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" /> },
];

const TAB_TITLES: Record<LeftPanelTab, string> = {
  algorithms: 'Algorithms',
  templates: 'Maze Templates',
  generator: 'Maze Generator',
  draw: 'Drawing Tools',
  compare: 'Compare Mode',
  community: 'Community',
  stats: 'Statistics',
  settings: 'Settings',
};

export function Sidebar() {
  const activeLeftTab = useUiStore((s) => s.activeLeftTab);
  const setActiveLeftTab = useUiStore((s) => s.setActiveLeftTab);

  return (
    <Tabs
      orientation="vertical"
      value={activeLeftTab}
      onValueChange={(v) => setActiveLeftTab(v as LeftPanelTab)}
      className="flex h-full w-full gap-0"
    >
      <TabsList className="!h-full w-12 shrink-0 flex-col gap-1 rounded-none border-r bg-background p-1.5">
        {TABS.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger
              render={
                <TabsTrigger
                  value={tab.id}
                  aria-label={tab.label}
                  className="!h-9 !w-9 !flex-none justify-center group-data-vertical/tabs:justify-center rounded-lg p-0"
                />
              }
            >
              {tab.icon}
            </TooltipTrigger>
            <TooltipContent side="right">{tab.label}</TooltipContent>
          </Tooltip>
        ))}
      </TabsList>

      <div className="min-h-0 min-w-0 flex-1 border-r bg-background">
        <ScrollArea className="h-full min-h-0">
          <div className="p-3">
            <h2 className="mb-3 text-sm font-semibold">{TAB_TITLES[activeLeftTab]}</h2>
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
          </div>
        </ScrollArea>
      </div>
    </Tabs>
  );
}
