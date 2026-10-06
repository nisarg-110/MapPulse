export interface MatchMeta {
  id: string;
  fileId: string;
  map: string;
  date: string;
  humans: number;
  bots: number;
  duration: number;
}

export interface PlayerData {
  id: string;
  bot: boolean;
  /** [pixelX, pixelY, ts_normalized_ms] */
  path: [number, number, number][];
  events: EventPoint[];
}

export interface EventPoint {
  px: number;
  py: number;
  ts: number;
  type: string;
}

export interface MatchData {
  id: string;
  map: string;
  date: string;
  players: PlayerData[];
}

export interface DataIndex {
  matches: MatchMeta[];
  maps: string[];
  dates: string[];
}

export type HeatmapType = "none" | "kills" | "deaths" | "traffic";
export type MapId = "AmbroseValley" | "GrandRift" | "Lockdown";
