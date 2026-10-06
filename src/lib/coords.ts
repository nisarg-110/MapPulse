import { MAP_CONFIG } from "./constants";
import type { MapId } from "./types";

/**
 * Convert world (x, z) coordinates to pixel coordinates on a 1024x1024 minimap.
 */
export function worldToPixel(
  x: number,
  z: number,
  mapId: MapId
): [number, number] {
  const cfg = MAP_CONFIG[mapId];
  if (!cfg) return [512, 512];

  const u = (x - cfg.originX) / cfg.scale;
  const v = (z - cfg.originZ) / cfg.scale;

  const px = Math.max(0, Math.min(1024, Math.round(u * 1024)));
  const py = Math.max(0, Math.min(1024, Math.round((1 - v) * 1024)));

  return [px, py];
}

/**
 * Format milliseconds as mm:ss or mm:ss.ms
 */
export function formatMs(ms: number, includeMs = false): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes  = Math.floor(totalSec / 60);
  const seconds  = totalSec % 60;
  const base     = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (!includeMs) return base;
  const millis = ms % 1000;
  return `${base}.${String(millis).padStart(3, "0")}`;
}
