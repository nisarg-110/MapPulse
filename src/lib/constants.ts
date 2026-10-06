import type { MapId } from "./types";

// ─── Map configuration ─────────────────────────────────────────────────────
export const MAP_CONFIG: Record<
  MapId,
  { scale: number; originX: number; originZ: number }
> = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500 },
};

// ─── Minimap image paths (served from /public/) ──────────────────────────────
export const MAP_IMAGE: Record<MapId, string> = {
  AmbroseValley: "/minimaps/AmbroseValley_Minimap.png",
  GrandRift:     "/minimaps/GrandRift_Minimap.png",
  Lockdown:      "/minimaps/Lockdown_Minimap.jpg",
};

// ─── Canvas size ─────────────────────────────────────────────────────────────
export const CANVAS_SIZE = 1024;

// ─── Heatmap grid ─────────────────────────────────────────────────────────
export const HEATMAP_GRID   = 32;   // 32x32 cells
export const HEATMAP_CELL   = CANVAS_SIZE / HEATMAP_GRID;  // 32px per cell

// ─── Event rendering ──────────────────────────────────────────────────────────
export const EVENT_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  Kill:          { fill: "#ef4444", stroke: "#ff6666", label: "Kill"           },
  Killed:        { fill: "#f97316", stroke: "#ffaa55", label: "Killed"         },
  BotKill:       { fill: "#dc2626", stroke: "#ef4444", label: "Bot Kill"       },
  BotKilled:     { fill: "#ea580c", stroke: "#f97316", label: "Bot Killed"     },
  KilledByStorm: { fill: "#3b82f6", stroke: "#60a5fa", label: "Storm Death"    },
  Loot:          { fill: "#eab308", stroke: "#fde047", label: "Loot"           },
};

// ─── Player path colours ─────────────────────────────────────────────────────
export const HUMAN_COLOR     = "#22d3ee";   // cyan
export const BOT_COLOR       = "#4b5563";   // dark gray
export const HUMAN_DOT_COLOR = "#00ffff";
export const BOT_DOT_COLOR   = "#9ca3af";

// ─── Playback ────────────────────────────────────────────────────────────────
export const SPEED_OPTIONS = [1, 5, 20] as const;
export const TICK_MS       = 50;  // setInterval interval
