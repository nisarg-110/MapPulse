# MapPulse — Architecture

## Tech Stack

| Layer      | Choice                    | Why                                                                                            |
|------------|---------------------------|------------------------------------------------------------------------------------------------|
| Framework  | Next.js 14 (App Router)   | Zero-config TypeScript, static export support, file-based routing.                             |
| Language   | TypeScript                | Catches shape mismatches between data pipeline output and frontend consumers at compile time.   |
| Styling    | Tailwind CSS              | Rapid dark-theme layout without a component library overhead.                                  |
| Rendering  | HTML5 Canvas (2D API)     | Direct pixel control; rendering 1,000+ path segments per frame via SVG would be too slow.      |
| Data prep  | Python / pandas + pyarrow | Parquet is a pandas-native format; pre-computing pixel coords in Python saves JS overhead.     |
| Hosting    | Static export (`output: 'export'`) | Deployable to Cloudflare Pages, Vercel, S3 — no server needed.                          |

---

## Data Flow: Parquet → Screen

```
player_data/
  February_10/ ... February_14/
    {user_id}_{match_id}.nakama-0  (Apache Parquet, ~65–100 rows each)
         │
         ▼
scripts/process_data.py
  1. Group files by match_id
  2. Decode event bytes → string
  3. Detect bot vs human (UUID vs numeric user_id)
  4. Convert world (x, z) → pixel (px, py)  ← coordinate mapping
  5. Normalize ts: subtract min_ts per match  → elapsed ms from 0
  6. Separate path (Position/BotPosition) from action events
  7. Write compact JSON per match
         │
         ▼
public/data/
  index.json           (match list, 796 entries)
  matches/{id}.json    (per-match, ~15KB average)
         │
         ▼
Browser: fetch(index.json)  →  DataIndex state
  User selects match
  fetch(matches/{id}.json)  →  MatchData state
         │
         ▼
MapCanvas.tsx  (useEffect re-renders canvas on every state change)
  Layer 1: drawImage(minimap)
  Layer 2: heatmap grid (32×32 cells, neighbor spread)
  Layer 3: player path polylines filtered by currentTime
  Layer 4: event markers at their recorded positions
  Layer 5: current-position dot (last path point ≤ currentTime)
```

---

## Coordinate Mapping

This is the trickiest part. The game uses a 3D right-handed world coordinate system. The minimap is a 1024×1024 pixel top-down image.

**The mapping per map:**

```
u = (x - originX) / scale          // normalized 0–1 along X axis
v = (z - originZ) / scale          // normalized 0–1 along Z axis

pixelX = u * 1024
pixelY = (1 - v) * 1024            // Y axis flipped: image origin is top-left
```

The `y` column (elevation) is discarded for 2D visualization.

Each map has its own `scale` and `(originX, originZ)` that define the world-space bounding box that maps onto the 1024×1024 image. Values are pre-clamped to [0, 1024] during processing so out-of-bounds events render at the map edge rather than crashing canvas rendering.

---

## Assumptions

1. **ts is match-elapsed time in milliseconds** stored as a Unix epoch offset. All timestamps are normalized to 0 at match start by subtracting the minimum ts across all players in a match.
2. **Bot detection is filename-based**: user_ids matching UUID format are humans; short numeric ids (e.g., `1440`, `382`) are bots.
3. **One parquet file = one player in one match**. A match is reconstructed by aggregating all files sharing the same `match_id`.
4. **map_id is consistent across all rows** in a single file (validated by taking `iloc[0]`).
5. **February 14 is a partial day** — matches from this date are included but may have fewer participants.

---

## Tradeoffs

| Decision                        | Pro                                              | Con / Caveat                                                      |
|---------------------------------|--------------------------------------------------|-------------------------------------------------------------------|
| Pre-compute pixel coords in Python | Frontend never does math; fast first render   | If minimap images are ever replaced/rescaled, pipeline must re-run |
| Compact JSON per match          | Small fetch (~15KB), fast parse                 | No streaming; entire match loaded at once                         |
| Canvas over WebGL               | Simple API, good enough for 1024×1024 at 50ms   | Not suitable for >100k path points per frame                      |
| 32×32 heatmap grid              | Fast to compute + render, clear visual signal   | Low spatial resolution; fine-grained hotspot location is approximate |
| `output: 'export'` (static)     | Deployable anywhere, no backend ops             | No server-side filtering / aggregation queries                    |
| setInterval for playback        | Predictable, easy to control speed              | Can drift under CPU load; requestAnimationFrame would be smoother |
