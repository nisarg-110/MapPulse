"use client";

import { useState, useEffect, useCallback } from "react";
import type { DataIndex, MatchMeta, MatchData, HeatmapType } from "@/lib/types";
import MapCanvas  from "@/components/MapCanvas";
import Sidebar    from "@/components/Sidebar";
import Timeline   from "@/components/Timeline";
import Legend     from "@/components/Legend";

// ─── Loading spinner ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-lila-accent/30 border-t-lila-accent animate-spin"
        />
        <span className="text-sm text-slate-500 font-mono">Loading…</span>
      </div>
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ matchData }: { matchData: MatchData | null }) {
  return (
    <header className="flex items-center gap-4 px-5 py-2.5 bg-lila-surface border-b border-lila-border shrink-0">
      <div className="flex items-center gap-2">
        {/* Logo accent */}
        <div className="w-2 h-6 bg-lila-accent rounded-sm" />
        <h1 className="text-sm font-bold tracking-widest uppercase text-white font-mono">
          MapPulse
        </h1>
        <span className="text-slate-500 text-xs font-mono ml-1">
          Player Journey Visualization
        </span>
      </div>

      {matchData && (
        <div className="ml-auto flex items-center gap-4 text-xs font-mono">
          <Chip label="MAP"   value={matchData.map}  color="#00d4ff" />
          <Chip label="DATE"  value={matchData.date} color="#94a3b8" />
          <Chip
            label="PLAYERS"
            value={`${matchData.players.filter((p) => !p.bot).length}H / ${matchData.players.filter((p) => p.bot).length}B`}
            color="#94a3b8"
          />
        </div>
      )}
    </header>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500">{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [dataIndex,      setDataIndex]      = useState<DataIndex | null>(null);
  const [indexLoading,   setIndexLoading]   = useState(true);
  const [indexError,     setIndexError]     = useState<string | null>(null);

  const [selectedMap,    setSelectedMap]    = useState<string>("all");
  const [selectedDate,   setSelectedDate]   = useState<string>("all");
  const [selectedMatch,  setSelectedMatch]  = useState<MatchMeta | null>(null);

  const [matchData,      setMatchData]      = useState<MatchData | null>(null);
  const [matchLoading,   setMatchLoading]   = useState(false);

  const [showHumans,     setShowHumans]     = useState(true);
  const [showBots,       setShowBots]       = useState(false);
  const [heatmapType,    setHeatmapType]    = useState<HeatmapType>("none");

  const [currentTime,    setCurrentTime]    = useState(0);
  const [playing,        setPlaying]        = useState(false);
  const [speed,          setSpeed]          = useState(1);

  // ── Load index ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/data/index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: DataIndex) => {
        setDataIndex(data);
        setIndexLoading(false);
      })
      .catch((e) => {
        setIndexError(String(e));
        setIndexLoading(false);
      });
  }, []);

  // ── Load match data when match selected ─────────────────────────────────────
  const loadMatch = useCallback(async (meta: MatchMeta) => {
    setMatchLoading(true);
    setMatchData(null);
    setCurrentTime(0);
    setPlaying(false);
    try {
      const r = await fetch(`/data/matches/${meta.fileId}.json`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: MatchData = await r.json();
      setMatchData(data);
    } catch (e) {
      console.error("Failed to load match:", e);
    } finally {
      setMatchLoading(false);
    }
  }, []);

  const handleMatchChange = useCallback(
    (meta: MatchMeta) => {
      setSelectedMatch(meta);
      loadMatch(meta);
    },
    [loadMatch]
  );

  // Stop playing when we reach the end
  const handlePlayPause = useCallback(() => {
    setPlaying((p) => {
      // If at end, restart
      if (!p && selectedMatch && currentTime >= selectedMatch.duration) {
        setCurrentTime(0);
      }
      return !p;
    });
  }, [currentTime, selectedMatch]);

  // Stats
  const stats = matchData
    ? {
        humans: matchData.players.filter((p) => !p.bot).length,
        bots:   matchData.players.filter((p) => p.bot).length,
        events: matchData.players.reduce((acc, p) => acc + p.events.length, 0),
      }
    : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (indexLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-lila-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-lila-accent/30 border-t-lila-accent animate-spin" />
          <span className="text-slate-400 font-mono text-sm">Loading match index…</span>
        </div>
      </div>
    );
  }

  if (indexError) {
    return (
      <div className="flex items-center justify-center h-screen bg-lila-bg">
        <div className="text-center max-w-md">
          <p className="text-red-400 font-mono text-sm mb-2">Failed to load data index</p>
          <p className="text-slate-500 text-xs font-mono">{indexError}</p>
          <p className="text-slate-600 text-xs mt-3">
            Run <code className="text-lila-accent">python scripts/process_data.py</code> from the project root to generate data files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-lila-bg overflow-hidden">
      {/* Top bar */}
      <TopBar matchData={matchData} />

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar
          dataIndex={dataIndex}
          selectedMap={selectedMap}
          selectedDate={selectedDate}
          selectedMatch={selectedMatch}
          showHumans={showHumans}
          showBots={showBots}
          heatmapType={heatmapType}
          onMapChange={setSelectedMap}
          onDateChange={setSelectedDate}
          onMatchChange={handleMatchChange}
          onToggleHumans={setShowHumans}
          onToggleBots={setShowBots}
          onHeatmapChange={setHeatmapType}
          stats={stats}
        />

        {/* Right panel */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* Canvas area */}
          <div className="flex-1 min-h-0 relative">
            {matchLoading ? (
              <Spinner />
            ) : (
              <MapCanvas
                matchData={matchData}
                currentTime={currentTime}
                showHumans={showHumans}
                showBots={showBots}
                heatmapType={heatmapType}
              />
            )}
          </div>

          {/* Timeline */}
          <Timeline
            duration={selectedMatch?.duration ?? 0}
            currentTime={currentTime}
            playing={playing}
            speed={speed}
            onTimeChange={setCurrentTime}
            onPlayPause={handlePlayPause}
            onSpeedChange={setSpeed}
          />

          {/* Legend */}
          <Legend />
        </div>
      </div>
    </div>
  );
}
