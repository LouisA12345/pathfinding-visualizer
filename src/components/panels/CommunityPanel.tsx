'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trophy, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import { useGridStore } from '@/store/gridStore';
import { useAlgorithmStore } from '@/store/algorithmStore';
import { getAlgorithm, ALGORITHMS } from '@/lib/algorithms/registry';
import { fetchSharedMazes, publishMaze, SharedMazeRecord } from '@/lib/community/mazes';
import {
  fetchHardestMazes,
  fetchLeaderboardForMaze,
  submitAttempt,
  LeaderboardEntry,
  MazeDifficultyEntry,
} from '@/lib/community/leaderboard';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PublishMazeSection() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const handlePublish = async () => {
    setPending(true);
    setMessage(null);
    const { grid } = useGridStore.getState();
    const { error } = await publishMaze(name, grid);
    setPending(false);
    if (error) setMessage(error);
    else {
      setMessage('Published!');
      setName('');
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">Publish this maze</p>
      {!user ? (
        <>
          <p className="text-xs text-muted-foreground">Log in to share the current grid as a maze others can attempt.</p>
          <Button size="sm" variant="outline" onClick={() => setAuthOpen(true)}>
            Log in
          </Button>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="maze-name" className="text-xs">
              Maze name
            </Label>
            <Input id="maze-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spiral of Doom" />
          </div>
          <Button size="sm" className="gap-1.5" disabled={pending || !name.trim()} onClick={handlePublish}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Publish
          </Button>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </>
      )}
    </div>
  );
}

function MazeGallerySection() {
  // `null` means "not loaded yet" — distinct from `[]` (loaded, genuinely
  // empty). Keeping that as the only signal (instead of a second `loading`
  // boolean set synchronously inside the effect) is what keeps the mount
  // effect below free of the "setState directly in an effect" anti-pattern:
  // it only ever calls setMazes from inside the `.then()` callback.
  const [mazes, setMazes] = useState<SharedMazeRecord[] | null>(null);
  const loadMaze = useCommunityStore((s) => s.loadMaze);
  const activeMazeId = useCommunityStore((s) => s.activeMazeId);

  useEffect(() => {
    fetchSharedMazes().then(setMazes);
  }, []);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Community mazes</p>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setMazes(null); fetchSharedMazes().then(setMazes); }}>
          Refresh
        </Button>
      </div>
      {mazes === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : mazes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No mazes published yet — be the first.</p>
      ) : (
        <ScrollArea className="h-48 rounded-md border">
          <div className="space-y-0.5 p-1">
            {mazes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => loadMaze(m.id, m.name, m.gridData)}
                className={`flex w-full flex-col rounded px-1.5 py-1 text-left text-[11px] hover:bg-muted ${
                  activeMazeId === m.id ? 'bg-primary/10' : ''
                }`}
              >
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground">
                  {m.width}×{m.height} · by {m.creatorUsername} · {timeAgo(m.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function ActiveMazeLeaderboardSection() {
  const activeMazeId = useCommunityStore((s) => s.activeMazeId);
  const activeMazeName = useCommunityStore((s) => s.activeMazeName);
  const selectedAlgoId = useAlgorithmStore((s) => s.selectedId);
  const result = useAlgorithmStore((s) => s.result);
  const user = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const def = getAlgorithm(selectedAlgoId);

  useEffect(() => {
    if (!activeMazeId) return;
    fetchLeaderboardForMaze(activeMazeId, selectedAlgoId).then(setEntries);
  }, [activeMazeId, selectedAlgoId]);

  if (!activeMazeId) return null;

  const handleSubmit = async () => {
    if (!result || !result.stats.success) return;
    setSubmitting(true);
    setSubmitMsg(null);
    const { error } = await submitAttempt(activeMazeId, selectedAlgoId, {
      runtimeMs: result.stats.runtimeMs,
      pathLength: result.stats.pathLength,
      pathCost: result.stats.pathCost,
      nodesVisited: result.stats.visited,
    });
    setSubmitting(false);
    if (error) setSubmitMsg(error);
    else {
      setSubmitMsg('Submitted!');
      fetchLeaderboardForMaze(activeMazeId, selectedAlgoId).then(setEntries);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Trophy className="h-3.5 w-3.5" /> Leaderboard — {activeMazeName}
      </p>
      <p className="text-xs text-muted-foreground">Ranked for {def?.shortName ?? selectedAlgoId} — pick a different algorithm to see its ranking.</p>

      {result?.stats.success && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={submitting}
            onClick={() => (user ? handleSubmit() : setAuthOpen(true))}
          >
            {!user ? 'Log in to submit' : submitting ? 'Submitting…' : 'Submit my result'}
          </Button>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </>
      )}
      {submitMsg && <p className="text-xs text-muted-foreground">{submitMsg}</p>}

      {entries === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No submissions yet for this algorithm.</p>
      ) : (
        <ScrollArea className="h-40 rounded-md border">
          <div className="space-y-0.5 p-1">
            {entries.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between px-1.5 py-1 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 text-muted-foreground">{i + 1}.</span>
                  {e.username}
                </span>
                <span className="text-muted-foreground">
                  {e.runtimeMs.toFixed(2)}ms · {e.pathLength} steps
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function HardestMazesSection() {
  const [algoId, setAlgoId] = useState(ALGORITHMS[0].id);
  const [entries, setEntries] = useState<MazeDifficultyEntry[] | null>(null);

  useEffect(() => {
    fetchHardestMazes(algoId).then(setEntries);
  }, [algoId]);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">Hardest mazes (whose maze takes longest)</p>
      <Select value={algoId} onValueChange={(value) => value && setAlgoId(value)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALGORITHMS.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.shortName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {entries === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No submissions yet for this algorithm.</p>
      ) : (
        <ScrollArea className="h-40 rounded-md border">
          <div className="space-y-0.5 p-1">
            {entries.map((e, i) => (
              <div key={e.mazeId} className="flex items-center justify-between px-1.5 py-1 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 text-muted-foreground">{i + 1}.</span>
                  <span className="font-medium">{e.mazeName}</span>
                </span>
                <span className="text-muted-foreground">
                  {e.creatorUsername} · avg {e.avgNodesVisited.toFixed(0)} nodes ({e.attemptCount})
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export function CommunityPanel() {
  return (
    <div className="space-y-3">
      <PublishMazeSection />
      <MazeGallerySection />
      <ActiveMazeLeaderboardSection />
      <Separator />
      <HardestMazesSection />
    </div>
  );
}
