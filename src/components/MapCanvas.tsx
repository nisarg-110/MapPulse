"use client";

import { useRef, useEffect, useCallback } from "react";
import type { MatchData, HeatmapType } from "@/lib/types";
import {
  CANVAS_SIZE,
  HEATMAP_GRID,
  HEATMAP_CELL,
  EVENT_COLORS,
  HUMAN_COLOR,
  BOT_COLOR,
  HUMAN_DOT_COLOR,
  BOT_DOT_COLOR,
  MAP_IMAGE,
} from "@/lib/constants";
import type { MapId } from "@/lib/types";

interface Props {
  matchData: MatchData | null;
  currentTime: number;
  showHumans: boolean;
  showBots: boolean;
  heatmapType: HeatmapType;
}

// Image cache so we don't reload on every render
const imageCache: Record<string, HTMLImageElement> = {};

function getMapImage(mapId: string): HTMLImageElement {
  if (imageCache[mapId]) return imageCache[mapId];
  const img = new Image();
  img.src = MAP_IMAGE[mapId as MapId] ?? "";
  imageCache[mapId] = img;
  return img;
}

// ─── Heatmap helpers ─────────────────────────────────────────────────────────
function buildGrid(size: number): number[][] {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function spreadNeighbors(grid: number[][], size: number): number[][] {
  const out = buildGrid(size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (!v) continue;
      out[r][c] += v;
      // spread to immediate neighbors at half weight
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          out[nr][nc] += v * 0.5;
        }
      }
    }
  }
  return out;
}

function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  grid: number[][],
  maxVal: number,
  killColor: boolean
) {
  if (maxVal === 0) return;
  for (let r = 0; r < HEATMAP_GRID; r++) {
    for (let c = 0; c < HEATMAP_GRID; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const alpha = Math.min(0.75, (v / maxVal) * 0.75);
      if (killColor) {
        ctx.fillStyle = `rgba(239,68,68,${alpha})`;
      } else {
        ctx.fillStyle = `rgba(59,130,246,${alpha})`;
      }
      ctx.fillRect(c * HEATMAP_CELL, r * HEATMAP_CELL, HEATMAP_CELL, HEATMAP_CELL);
    }
  }
}

// ─── Event marker drawing ─────────────────────────────────────────────────────
function drawEventMarker(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  type: string,
  scale = 1
) {
  const colors = EVENT_COLORS[type];
  if (!colors) return;

  const r = 6 * scale;
  ctx.save();
  ctx.translate(px, py);

  switch (type) {
    case "Kill":
    case "BotKill": {
      // Red X
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(-r, -r); ctx.lineTo(r, r);
      ctx.moveTo(r, -r);  ctx.lineTo(-r, r);
      ctx.stroke();
      break;
    }
    case "Killed":
    case "BotKilled": {
      // Skull-ish: orange circle with X inside
      ctx.fillStyle = colors.fill + "cc";
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // inner cross
      ctx.strokeStyle = "#ffffff99";
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.5); ctx.lineTo(r * 0.5, r * 0.5);
      ctx.moveTo(r * 0.5, -r * 0.5);  ctx.lineTo(-r * 0.5, r * 0.5);
      ctx.stroke();
      break;
    }
    case "KilledByStorm": {
      // Blue lightning bolt (triangle pointing down)
      ctx.fillStyle = colors.fill;
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.5, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(r * 0.5, r);
      ctx.lineTo(-r * 0.5, -r * 0.2);
      ctx.lineTo(0, -r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "Loot": {
      // Yellow diamond
      ctx.fillStyle = colors.fill;
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = colors.fill;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MapCanvas({
  matchData,
  currentTime,
  showHumans,
  showBots,
  heatmapType,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = CANVAS_SIZE;
    const H = CANVAS_SIZE;

    // Clear
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0b0f";
    ctx.fillRect(0, 0, W, H);

    // ── Layer 1: Minimap background ──────────────────────────────────────────
    if (matchData) {
      const img = getMapImage(matchData.map);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, W, H);
        // darken slightly for better overlay visibility
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, W, H);
      } else {
        img.onload = () => render();
        // Draw placeholder
        ctx.fillStyle = "#12141a";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#1e2130";
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Loading map…", W / 2, H / 2);
      }
    } else {
      ctx.fillStyle = "#12141a";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#2d3450";
      ctx.font = "20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Select a match to begin", W / 2, H / 2);
      return;
    }

    const players = matchData.players;

    // ── Layer 2: Heatmap ────────────────────────────────────────────────────
    if (heatmapType !== "none") {
      const grid = buildGrid(HEATMAP_GRID);

      for (const p of players) {
        if (p.bot && !showBots)   continue;
        if (!p.bot && !showHumans) continue;

        if (heatmapType === "traffic") {
          for (const [px, py, ts] of p.path) {
            if (ts > currentTime) continue;
            const gc = Math.min(HEATMAP_GRID - 1, Math.floor(px / HEATMAP_CELL));
            const gr = Math.min(HEATMAP_GRID - 1, Math.floor(py / HEATMAP_CELL));
            grid[gr][gc]++;
          }
        } else {
          const targetEvents =
            heatmapType === "kills"
              ? ["Kill", "BotKill"]
              : ["Killed", "BotKilled", "KilledByStorm"];
          for (const ev of p.events) {
            if (ev.ts > currentTime) continue;
            if (!targetEvents.includes(ev.type)) continue;
            const gc = Math.min(HEATMAP_GRID - 1, Math.floor(ev.px / HEATMAP_CELL));
            const gr = Math.min(HEATMAP_GRID - 1, Math.floor(ev.py / HEATMAP_CELL));
            grid[gr][gc]++;
          }
        }
      }

      const spread = spreadNeighbors(grid, HEATMAP_GRID);
      const maxVal = Math.max(...spread.flat());
      drawHeatmap(ctx, spread, maxVal, heatmapType !== "traffic");
    }

    // ── Layer 3: Player paths ────────────────────────────────────────────────
    for (const p of players) {
      if (p.bot && !showBots)   continue;
      if (!p.bot && !showHumans) continue;

      const color = p.bot ? BOT_COLOR : HUMAN_COLOR;
      const alpha = p.bot ? "55" : "88";

      const visPath = p.path.filter(([, , ts]) => ts <= currentTime);
      if (visPath.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = color + alpha;
      ctx.lineWidth = p.bot ? 1 : 1.5;
      ctx.lineJoin = "round";
      ctx.moveTo(visPath[0][0], visPath[0][1]);
      for (let i = 1; i < visPath.length; i++) {
        ctx.lineTo(visPath[i][0], visPath[i][1]);
      }
      ctx.stroke();
    }

    // ── Layer 4: Event markers ───────────────────────────────────────────────
    for (const p of players) {
      if (p.bot && !showBots)   continue;
      if (!p.bot && !showHumans) continue;

      for (const ev of p.events) {
        if (ev.ts > currentTime) continue;
        drawEventMarker(ctx, ev.px, ev.py, ev.type);
      }
    }

    // ── Layer 5: Current position dots ───────────────────────────────────────
    for (const p of players) {
      if (p.bot && !showBots)   continue;
      if (!p.bot && !showHumans) continue;

      // Find last path point at or before currentTime
      let lastPt: [number, number, number] | null = null;
      for (let i = p.path.length - 1; i >= 0; i--) {
        if (p.path[i][2] <= currentTime) {
          lastPt = p.path[i];
          break;
        }
      }
      if (!lastPt) continue;

      const dotColor = p.bot ? BOT_DOT_COLOR : HUMAN_DOT_COLOR;
      const radius   = p.bot ? 3 : 5;

      ctx.beginPath();
      ctx.fillStyle   = dotColor;
      ctx.strokeStyle = "#000000aa";
      ctx.lineWidth   = 1;
      ctx.arc(lastPt[0], lastPt[1], radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [matchData, currentTime, showHumans, showBots, heatmapType]);

  // Re-render whenever deps change
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-lila-bg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          display: "block",
        }}
        className="rounded"
      />
    </div>
  );
}
