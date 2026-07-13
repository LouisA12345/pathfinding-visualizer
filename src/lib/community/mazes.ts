import { createClient } from '@/lib/supabase/client';
import { Grid, SerializedGrid } from '@/lib/grid/Grid';

export interface SharedMazeRecord {
  id: string;
  creatorId: string;
  creatorUsername: string;
  name: string;
  width: number;
  height: number;
  gridData: SerializedGrid;
  createdAt: string;
}

// Supabase's JS client returns a loosely-typed row shape for joined selects
// without generated types (would need the Supabase CLI linked to a real
// project, which isn't set up here) — this describes exactly the columns
// `fetchSharedMazes`'s query below asks for, nothing more.
interface SharedMazeRow {
  id: string;
  creator_id: string;
  name: string;
  width: number;
  height: number;
  grid_data: SerializedGrid;
  created_at: string;
  profiles: { username: string } | null;
}

export async function publishMaze(name: string, grid: Grid): Promise<{ error?: string }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'You must be logged in to publish a maze.' };
  if (!name.trim()) return { error: 'Give the maze a name first.' };

  const { error } = await supabase.from('shared_mazes').insert({
    creator_id: userData.user.id,
    name: name.trim(),
    width: grid.width,
    height: grid.height,
    grid_data: grid.serialize(),
  });
  return error ? { error: error.message } : {};
}

export async function fetchSharedMazes(): Promise<SharedMazeRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('shared_mazes')
    .select('id, creator_id, name, width, height, grid_data, created_at, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return (data as unknown as SharedMazeRow[]).map((row) => ({
    id: row.id,
    creatorId: row.creator_id,
    creatorUsername: row.profiles?.username ?? 'unknown',
    name: row.name,
    width: row.width,
    height: row.height,
    gridData: row.grid_data,
    createdAt: row.created_at,
  }));
}

export async function deleteSharedMaze(id: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('shared_mazes').delete().eq('id', id);
  return error ? { error: error.message } : {};
}
