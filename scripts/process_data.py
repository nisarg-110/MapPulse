#!/usr/bin/env python3
"""
LILA BLACK - Player Journey Data Processor
Reads all parquet files from player_data/ and outputs:
  - public/data/index.json     (match index)
  - public/data/matches/*.json (per-match player data)
"""

import os
import re
import json
import math
import pandas as pd
from collections import defaultdict
from datetime import datetime

# ─── Config ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "..", "player_data")
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "data")
MATCHES_DIR = os.path.join(OUTPUT_DIR, "matches")

DAY_FOLDERS = [
    ("February_10", "2026-02-10"),
    ("February_11", "2026-02-11"),
    ("February_12", "2026-02-12"),
    ("February_13", "2026-02-13"),
    ("February_14", "2026-02-14"),
]

MAP_CONFIG = {
    "AmbroseValley": {"scale": 900,  "originX": -370, "originZ": -473},
    "GrandRift":     {"scale": 581,  "originX": -290, "originZ": -290},
    "Lockdown":      {"scale": 1000, "originX": -500, "originZ": -500},
}

PATH_EVENTS   = {"Position", "BotPosition"}
ACTION_EVENTS = {"Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"}

UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE
)

# ─── Coordinate helpers ────────────────────────────────────────────────────────
def world_to_pixel(x: float, z: float, map_id: str):
    cfg = MAP_CONFIG.get(map_id)
    if cfg is None:
        return 512, 512  # fallback centre
    u = (x - cfg["originX"]) / cfg["scale"]
    v = (z - cfg["originZ"]) / cfg["scale"]
    px = int(max(0, min(1024, u * 1024)))
    py = int(max(0, min(1024, (1 - v) * 1024)))
    return px, py


def is_bot(user_id: str) -> bool:
    return not bool(UUID_PATTERN.match(user_id))


def decode_event(raw) -> str:
    if isinstance(raw, (bytes, bytearray)):
        return raw.decode("utf-8", errors="replace")
    s = str(raw)
    # strip b'...' wrapper if present
    if s.startswith("b'") and s.endswith("'"):
        s = s[2:-1]
    return s

# ─── Step 1: collect all files per match ──────────────────────────────────────
print("=" * 60)
print("LILA BLACK Data Processor")
print("=" * 60)
print(f"Data dir:   {DATA_DIR}")
print(f"Output dir: {OUTPUT_DIR}")
print()

os.makedirs(MATCHES_DIR, exist_ok=True)

# match_id -> {date, files: [(user_id, filepath)], map_id}
matches: dict[str, dict] = {}
total_files = 0
skipped = 0

for folder_name, date_str in DAY_FOLDERS:
    folder_path = os.path.join(DATA_DIR, folder_name)
    if not os.path.isdir(folder_path):
        print(f"  [WARN] Folder not found: {folder_path}")
        continue

    files = os.listdir(folder_path)
    print(f"  {folder_name}: {len(files)} files")

    for fname in files:
        filepath = os.path.join(folder_path, fname)
        # filename: {user_id}_{match_uuid}.nakama-0
        underscore_idx = fname.index("_")
        user_id  = fname[:underscore_idx]
        match_id = fname[underscore_idx + 1:]  # includes .nakama-0

        if match_id not in matches:
            matches[match_id] = {"date": date_str, "files": [], "map_id": None}
        matches[match_id]["files"].append((user_id, filepath))
        total_files += 1

print()
print(f"Total files found : {total_files}")
print(f"Unique matches    : {len(matches)}")
print()

# ─── Step 2: process each match ───────────────────────────────────────────────
match_index = []
processed = 0
errors    = 0

for match_id, meta in matches.items():
    date_str = meta["date"]
    files    = meta["files"]

    # --- Load all player files for this match ---
    players_raw: dict[str, dict] = {}  # user_id -> {path:[], events:[], map_id, bot}

    for user_id, filepath in files:
        try:
            df = pd.read_parquet(filepath)
        except Exception as e:
            skipped += 1
            continue

        if df.empty:
            continue

        map_id = str(df["map_id"].iloc[0])
        if meta["map_id"] is None:
            meta["map_id"] = map_id

        df["event_str"] = df["event"].apply(decode_event)
        ts_int = df["ts"].astype("int64")

        if user_id not in players_raw:
            players_raw[user_id] = {
                "map_id": map_id,
                "bot": is_bot(user_id),
                "path_rows": [],    # (ts_int, x, z)
                "event_rows": [],   # (ts_int, x, z, event_str)
            }

        for _, row in df.iterrows():
            ev  = row["event_str"]
            x   = float(row["x"])
            z   = float(row["z"])
            # The parquet column is typed datetime64[ms] but the raw int64 values
            # represent UNIX seconds (not ms). Multiply by 1000 to get true ms.
            raw_s = int(row["ts"].value // 1_000_000) if hasattr(row["ts"], 'value') else int(ts_int.loc[row.name])
            ts    = raw_s * 1000

            if ev in PATH_EVENTS:
                players_raw[user_id]["path_rows"].append((ts, x, z))
            elif ev in ACTION_EVENTS:
                players_raw[user_id]["event_rows"].append((ts, x, z, ev))

    if not players_raw:
        skipped += 1
        continue

    map_id = meta["map_id"] or "AmbroseValley"

    # --- Normalise timestamps: subtract global match min_ts ---
    all_ts = []
    for p in players_raw.values():
        all_ts.extend(t for t, *_ in p["path_rows"])
        all_ts.extend(t for t, *_ in p["event_rows"])

    if not all_ts:
        skipped += 1
        continue

    min_ts = min(all_ts)
    max_ts = max(all_ts)
    duration = max_ts - min_ts  # ms

    # --- Build compact player list ---
    players_out = []
    humans = 0
    bots   = 0

    for user_id, pdata in players_raw.items():
        if pdata["bot"]:
            bots += 1
        else:
            humans += 1

        # path: [[px, py, ts_norm], ...]
        path = []
        for (ts, x, z) in sorted(pdata["path_rows"], key=lambda r: r[0]):
            px, py = world_to_pixel(x, z, map_id)
            path.append([px, py, ts - min_ts])

        # events: [{"px":..,"py":..,"ts":..,"type":..}, ...]
        events = []
        for (ts, x, z, ev) in sorted(pdata["event_rows"], key=lambda r: r[0]):
            px, py = world_to_pixel(x, z, map_id)
            events.append({"px": px, "py": py, "ts": ts - min_ts, "type": ev})

        players_out.append({
            "id":     user_id,
            "bot":    pdata["bot"],
            "path":   path,
            "events": events,
        })

    # --- Write per-match JSON ---
    # fileId: replace dots with underscores for safe filenames
    file_id = match_id.replace(".", "_")
    match_json = {
        "id":      match_id,
        "map":     map_id,
        "date":    date_str,
        "players": players_out,
    }
    out_path = os.path.join(MATCHES_DIR, f"{file_id}.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(match_json, fh, separators=(",", ":"))

    # --- Append to index ---
    match_index.append({
        "id":       match_id,
        "fileId":   file_id,
        "map":      map_id,
        "date":     date_str,
        "humans":   humans,
        "bots":     bots,
        "duration": duration,
    })
    processed += 1

    if processed % 100 == 0:
        print(f"  Processed {processed}/{len(matches)} matches...")

print(f"  Processed {processed}/{len(matches)} matches  (skipped {skipped})")
print()

# ─── Step 3: write index.json ─────────────────────────────────────────────────
all_maps  = sorted({m["map"]  for m in match_index})
all_dates = sorted({m["date"] for m in match_index})

index_json = {
    "matches": match_index,
    "maps":    all_maps,
    "dates":   all_dates,
}
index_path = os.path.join(OUTPUT_DIR, "index.json")
with open(index_path, "w", encoding="utf-8") as fh:
    json.dump(index_json, fh, indent=2)

print(f"index.json written  -> {index_path}")
print(f"  {len(match_index)} matches, {len(all_maps)} maps, {len(all_dates)} dates")

# ─── Final stats ──────────────────────────────────────────────────────────────
map_counts = defaultdict(int)
date_counts = defaultdict(int)
total_humans = 0
total_bots   = 0
for m in match_index:
    map_counts[m["map"]] += 1
    date_counts[m["date"]] += 1
    total_humans += m["humans"]
    total_bots   += m["bots"]

print()
print("-" * 40)
print("SUMMARY")
print("-" * 40)
print(f"Matches processed : {processed}")
print(f"Matches skipped   : {skipped}")
print(f"Total players     : {total_humans + total_bots}  (humans={total_humans}, bots={total_bots})")
print()
print("By map:")
for k, v in sorted(map_counts.items()):
    print(f"  {k:<20} {v} matches")
print()
print("By date:")
for k, v in sorted(date_counts.items()):
    print(f"  {k}  {v} matches")
print()
print("Done!")
