"use client";

import type { DataIndex, MatchMeta, HeatmapType } from "@/lib/types";
import { formatMs } from "@/lib/coords";

interface Props {
  dataIndex: DataIndex | null;
  selectedMap: string;
  selectedDate: string;
  selectedMatch: MatchMeta | null;
  showHumans: boolean;
  showBots: boolean;
  heatmapType: HeatmapType;
  onMapChange: (map: string) => void;
  onDateChange: (date: string) => void;
  onMatchChange: (match: MatchMeta) => void;
  onToggleHumans: (v: boolean) => void;
  onToggleBots: (v: boolean) => void;
  onHeatmapChange: (h: HeatmapType) => void;
  stats: { humans: number; bots: number; events: number } | null;
}

const HEATMAP_OPTIONS: { value: HeatmapType; label: string }[] = [
  { value: "none",    label: "None"          },
  { value: "kills",   label: "Kill Zones"    },
  { value: "deaths",  label: "Death Zones"   },
  { value: "traffic", label: "Traffic"       },
];

export default function Sidebar({
  dataIndex,
  selectedMap,
  selectedDate,
  selectedMatch,
  showHumans,
  showBots,
  heatmapType,
  onMapChange,
  onDateChange,
  onMatchChange,
  onToggleHumans,
  onToggleBots,
  onHeatmapChange,
  stats,
}: Props) {
  const maps  = dataIndex?.maps  ?? [];
  const dates = dataIndex?.dates ?? [];

  // Filtered matches
  const filteredMatches = (dataIndex?.matches ?? []).filter((m) => {
    if (selectedMap  && selectedMap  !== "all" && m.map  !== selectedMap)  return false;
    if (selectedDate && selectedDate !== "all" && m.date !== selectedDate) return false;
    return true;
  });

  return (
    <aside className="w-64 flex-shrink-0 bg-lila-surface border-r border-lila-border flex flex-col overflow-y-auto">
      {/* Title */}
      <div className="px-4 py-3 border-b border-lila-border">
        <h2 className="text-xs font-semibold text-lila-accent uppercase tracking-widest">
          Filters
        </h2>
      </div>

      <div className="flex flex-col gap-4 p-4">

        {/* Map filter */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Map</label>
          <select
            className="w-full"
            value={selectedMap}
            onChange={(e) => onMapChange(e.target.value)}
          >
            <option value="all">All Maps</option>
            {maps.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Date filter */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Date</label>
          <select
            className="w-full"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          >
            <option value="all">All Dates</option>
            {dates.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Match selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">
            Match <span className="text-slate-500">({filteredMatches.length})</span>
          </label>
          <select
            className="w-full"
            value={selectedMatch?.id ?? ""}
            onChange={(e) => {
              const m = filteredMatches.find((x) => x.id === e.target.value);
              if (m) onMatchChange(m);
            }}
          >
            <option value="">— select match —</option>
            {filteredMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.map.slice(0,12)} · {m.date.slice(5)} · {m.humans}H {m.bots}B
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="border-t border-lila-border" />

        {/* Overlays */}
        <div>
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Overlays</p>

          {/* Toggles */}
          <div className="flex flex-col gap-2">
            <ToggleRow
              label="Humans"
              color="#22d3ee"
              checked={showHumans}
              onChange={onToggleHumans}
            />
            <ToggleRow
              label="Bots"
              color="#6b7280"
              checked={showBots}
              onChange={onToggleBots}
            />
          </div>
        </div>

        {/* Heatmap type */}
        <div>
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Heatmap</p>
          <div className="flex flex-col gap-1">
            {HEATMAP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onHeatmapChange(opt.value)}
                className={`text-left px-3 py-1.5 rounded text-sm transition-all ${
                  heatmapType === opt.value
                    ? "bg-lila-accent/20 text-lila-accent border border-lila-accent/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-lila-border/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-lila-border" />

        {/* Stats */}
        {selectedMatch && (
          <div>
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Match Stats</p>
            <div className="flex flex-col gap-1 text-sm">
              <StatRow label="Map"     value={selectedMatch.map} />
              <StatRow label="Date"    value={selectedMatch.date} />
              <StatRow label="Humans"  value={String(selectedMatch.humans)} color="#22d3ee" />
              <StatRow label="Bots"    value={String(selectedMatch.bots)}   color="#6b7280" />
              <StatRow label="Duration" value={formatMs(selectedMatch.duration)} />
              {stats && (
                <StatRow label="Events"  value={String(stats.events)} />
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function ToggleRow({
  label,
  color,
  checked,
  onChange,
}: {
  label: string;
  color: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div
        className="relative w-8 h-4 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? color + "55" : "#1e2130" }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200"
          style={{
            backgroundColor: checked ? color : "#4b5563",
            left: checked ? "17px" : "2px",
          }}
        />
      </div>
      <span
        className="text-sm transition-colors"
        style={{ color: checked ? color : "#6b7280" }}
      >
        {label}
      </span>
    </label>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-xs font-mono" style={{ color: color ?? "#e2e8f0" }}>
        {value}
      </span>
    </div>
  );
}

