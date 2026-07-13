import { createClient } from '@/lib/supabase/client';

export interface AttemptStats {
  runtimeMs: number;
  pathLength: number;
  pathCost: number;
  nodesVisited: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  algorithmId: string;
  runtimeMs: number;
  pathLength: number;
  pathCost: number;
  nodesVisited: number;
  createdAt: string;
}

export interface MazeDifficultyEntry {
  mazeId: string;
  mazeName: string;
  creatorUsername: string;
  attemptCount: number;
  avgRuntimeMs: number;
  avgNodesVisited: number;
}

interface AttemptRow {
  id: string;
  algorithm_id: string;
  runtime_ms: number;
  path_length: number;
  path_cost: number;
  nodes_visited: number;
  created_at: string;
  profiles: { username: string } | null;
}

export async function submitAttempt(mazeId: string, algorithmId: string, stats: AttemptStats): Promise<{ error?: string }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'You must be logged in to submit a leaderboard entry.' };

  const { error } = await supabase.from('maze_attempts').insert({
    maze_id: mazeId,
    user_id: userData.user.id,
    algorithm_id: algorithmId,
    runtime_ms: stats.runtimeMs,
    path_length: stats.pathLength,
    path_cost: stats.pathCost,
    nodes_visited: stats.nodesVisited,
  });
  return error ? { error: error.message } : {};
}

/** Every attempt on one maze with one algorithm, fastest (lowest runtime) first. */
export async function fetchLeaderboardForMaze(mazeId: string, algorithmId: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('maze_attempts')
    .select('id, algorithm_id, runtime_ms, path_length, path_cost, nodes_visited, created_at, profiles(username)')
    .eq('maze_id', mazeId)
    .eq('algorithm_id', algorithmId)
    .order('runtime_ms', { ascending: true })
    .limit(50);

  if (error || !data) return [];
  return (data as unknown as AttemptRow[]).map((row) => ({
    id: row.id,
    username: row.profiles?.username ?? 'unknown',
    algorithmId: row.algorithm_id,
    runtimeMs: row.runtime_ms,
    pathLength: row.path_length,
    pathCost: row.path_cost,
    nodesVisited: row.nodes_visited,
    createdAt: row.created_at,
  }));
}

interface DifficultyAttemptRow {
  maze_id: string;
  runtime_ms: number;
  nodes_visited: number;
  shared_mazes: { name: string; profiles: { username: string } | null } | null;
}

/**
 * Ranks mazes by how hard they are for one algorithm — "whose maze takes
 * longest." Aggregated client-side over the raw attempt rows rather than a
 * SQL view/RPC: simpler to keep in the same data-access style as everything
 * else here, and fine at this app's scale (a hobby leaderboard, not a
 * high-traffic service).
 */
export async function fetchHardestMazes(algorithmId: string): Promise<MazeDifficultyEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('maze_attempts')
    .select('maze_id, runtime_ms, nodes_visited, shared_mazes(name, profiles(username))')
    .eq('algorithm_id', algorithmId)
    .limit(1000);

  if (error || !data) return [];

  const byMaze = new Map<string, { name: string; creator: string; runtimes: number[]; nodes: number[] }>();
  for (const row of data as unknown as DifficultyAttemptRow[]) {
    const existing = byMaze.get(row.maze_id);
    if (existing) {
      existing.runtimes.push(row.runtime_ms);
      existing.nodes.push(row.nodes_visited);
    } else {
      byMaze.set(row.maze_id, {
        name: row.shared_mazes?.name ?? 'unknown maze',
        creator: row.shared_mazes?.profiles?.username ?? 'unknown',
        runtimes: [row.runtime_ms],
        nodes: [row.nodes_visited],
      });
    }
  }

  const average = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length;

  return Array.from(byMaze.entries())
    .map(([mazeId, v]) => ({
      mazeId,
      mazeName: v.name,
      creatorUsername: v.creator,
      attemptCount: v.runtimes.length,
      avgRuntimeMs: average(v.runtimes),
      avgNodesVisited: average(v.nodes),
    }))
    .sort((a, b) => b.avgNodesVisited - a.avgNodesVisited);
}
