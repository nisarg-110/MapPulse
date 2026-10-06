"use client";

import { useEffect, useRef, useCallback } from "react";
import { SPEED_OPTIONS, TICK_MS } from "@/lib/constants";
import { formatMs } from "@/lib/coords";

interface Props {
  duration: number;      // match duration in ms
  currentTime: number;
  playing: boolean;
  speed: number;
  onTimeChange: (t: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (s: number) => void;
}

export default function Timeline({
  duration,
  currentTime,
  playing,
  speed,
  onTimeChange,
  onPlayPause,
  onSpeedChange,
}: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const advance = useCallback(() => {
    const next = currentTimeRef.current + TICK_MS * speed;
    if (next >= duration) {
      onTimeChange(duration);
      onPlayPause(); // stop
    } else {
      onTimeChange(next);
    }
  }, [speed, duration, onTimeChange, onPlayPause]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(advance, TICK_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, advance]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-lila-surface border-t border-lila-border">
      {/* Scrubber */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-lila-accent w-16 text-right shrink-0">
          {formatMs(currentTime, true)}
        </span>
        <input
          type="range"
          min={0}
          max={duration}
          step={1}
          value={currentTime}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          className="flex-1"
          style={{
            background: `linear-gradient(to right, #00d4ff ${pct}%, #1e2130 ${pct}%)`,
          }}
        />
        <span className="text-xs font-mono text-slate-500 w-16 shrink-0">
          {formatMs(duration, true)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-lila-accent/20 hover:bg-lila-accent/40 border border-lila-accent/40 transition-all text-lila-accent"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            // Pause icon
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="1" width="3" height="10" rx="1"/>
              <rect x="7" y="1" width="3" height="10" rx="1"/>
            </svg>
          ) : (
            // Play icon
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <polygon points="2,1 11,6 2,11"/>
            </svg>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={() => onTimeChange(0)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-lila-border hover:bg-lila-border/80 transition-all text-slate-400 hover:text-slate-200"
          title="Reset to start"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2V0L3 3l3 3V4c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4H0c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6z"/>
          </svg>
        </button>

        {/* Speed buttons */}
        <div className="flex gap-1 ml-2">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-xs rounded font-mono transition-all ${
                speed === s
                  ? "bg-lila-accent/20 text-lila-accent border border-lila-accent/40"
                  : "text-slate-400 border border-lila-border hover:text-slate-200 hover:border-slate-500"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Progress text */}
        <span className="ml-auto text-xs text-slate-500 font-mono">
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
