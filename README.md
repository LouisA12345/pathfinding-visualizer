# Pathfinding Visualizer

An interactive pathfinding and maze-generation visualizer. Draw a grid, generate a maze, run a search algorithm, and watch it explore step by step — plus a compare mode, a benchmark dashboard, and a community leaderboard for racing algorithms against other people's mazes.

## Features

- **15 algorithms** — BFS, DFS, Dijkstra, A*, Weighted A*, Greedy Best-First Search, Bidirectional BFS, Jump Point Search, Bidirectional A*, Theta* (any-angle), IDA*, Bellman-Ford, Wavefront/Lee's Algorithm, Fringe Search, Floyd-Warshall — each with pseudocode, complexity, history, and real-world use cases.
- **13 maze generators** — Empty Grid, Random Walls, Recursive Division, Recursive Backtracking, Prim's, Binary Tree, Sidewinder, Wilson's, Growing Tree, Spiral, Rooms & Corridors, Symmetrical, Obstacle Course.
- **Full drawing toolkit** — walls, terrain (weighted cells), multiple starts/goals, checkpoints, rectangle/line/circle/bucket fill, select + copy/paste, rotate/mirror, undo/redo.
- **Playback controls** — play/pause/step/scrub/skip-to-end, adjustable speed, live pseudocode-line highlighting.
- **Compare mode** — run 2–4 algorithms side by side on the same grid.
- **Benchmark dashboard** — run every algorithm against the current grid and chart runtime, nodes explored, and path cost.
- **Community mazes & leaderboards** — log in, publish a maze, and see how your algorithm's runtime ranks against everyone else's attempts on that maze (and which published mazes are hardest overall, per algorithm).
- Import/export mazes as JSON, export the canvas as PNG/SVG, dark/light themes, keyboard shortcuts, resizable panels.

## Tech stack

Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Zustand for state, Canvas2D for the grid, Supabase (Postgres + Auth) for accounts/mazes/leaderboards.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Setting up Supabase (for accounts, community mazes, and leaderboards)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) — it creates the `profiles`, `shared_mazes`, and `maze_attempts` tables with row-level security policies. Safe to re-run.
3. Copy your project's URL and anon/publishable key (Project Settings → API) into `.env.local`.
4. By default Supabase requires email confirmation on signup; toggle it off under Authentication → Providers → Email if you want signups to log straight in.

Without a Supabase project configured, everything except login/community/leaderboards still works.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
