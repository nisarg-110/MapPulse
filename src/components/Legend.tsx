"use client";

import { EVENT_COLORS, HUMAN_COLOR, BOT_COLOR } from "@/lib/constants";

export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2 bg-lila-surface border-t border-lila-border text-xs">
      {/* Path legend */}
      <LegendItem color={HUMAN_COLOR} shape="line" label="Human path" />
      <LegendItem color={BOT_COLOR}   shape="line" label="Bot path"   />

      {/* Divider */}
      <span className="text-lila-border">|</span>

      {/* Events */}
      {Object.entries(EVENT_COLORS).map(([type, { fill, label }]) => (
        <LegendItem key={type} color={fill} shape={shapeFor(type)} label={label} />
      ))}
    </div>
  );
}

function shapeFor(type: string): "x" | "circle" | "diamond" | "bolt" {
  if (type === "Kill" || type === "BotKill")    return "x";
  if (type === "Loot")                          return "diamond";
  if (type === "KilledByStorm")                 return "bolt";
  return "circle";
}

function LegendItem({
  color,
  shape,
  label,
}: {
  color: string;
  shape: "line" | "x" | "circle" | "diamond" | "bolt";
  label: string;
}) {
  const size = 14;
  return (
    <div className="flex items-center gap-1.5 text-slate-400">
      <svg width={size} height={size} viewBox="0 0 14 14" overflow="visible">
        {shape === "line" && (
          <line x1="1" y1="7" x2="13" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
        )}
        {shape === "circle" && (
          <circle cx="7" cy="7" r="5" fill={color} />
        )}
        {shape === "x" && (
          <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </g>
        )}
        {shape === "diamond" && (
          <polygon
            points="7,1 13,7 7,13 1,7"
            fill={color}
          />
        )}
        {shape === "bolt" && (
          <polygon
            points="7,1 10,6 7,6 10,13 4,8 7,8 4,1"
            fill={color}
          />
        )}
      </svg>
      <span>{label}</span>
    </div>
  );
}
