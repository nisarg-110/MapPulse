# LILA BLACK — Data Insights

Three observations derived from the full five-day dataset (Feb 10–14 2026, 796 matches, ~89,000 event rows).

---

## Insight 1 — Storm Deaths Are Rare but Spatially Concentrated on Lockdown

### What caught my eye

Storm-death (`KilledByStorm`) events are uncommon overall — only 39 across all three maps — but their distribution is uneven. On **Lockdown**, storm deaths are disproportionately clustered in two tight zones near the map's upper-centre area.

### The numbers

| Map           | Matches | Storm Deaths | Deaths/Match |
|---------------|---------|--------------|--------------|
| AmbroseValley | 566     | 17           | 0.030        |
| Lockdown      | 171     | 17           | 0.099        |
| GrandRift     | 59      | 5            | 0.085        |

**Lockdown has 3× the per-match storm-death rate of AmbroseValley.**

On Lockdown, two zones dominate storm casualties:
- Zone (8, 4) — pixel region x=512–576, y=256–320 — **2 deaths**
- Zone (11, 7) — pixel region x=704–768, y=448–512 — **2 deaths**

These two zones together account for ~24% of all Lockdown storm deaths despite covering less than 1.6% of map area.

### Why a level designer should care

The clustering suggests there is a structural funnel: players moving to avoid the storm are being caught in the same narrow corridors. Either (a) the storm boundary converges on these quadrants, creating a "last safe zone" choke, or (b) there is insufficient cover or traversal routes in these grid squares, causing players to spend extra seconds there. Adding a secondary escape route or cover element in these two zones on Lockdown should reduce frustration deaths and make the storm mechanic feel more about decision-making than map geometry.

### Actionable items

1. Check the storm contraction path for Lockdown — if it consistently closes through quadrant (8–9, 4–5), rotate the starting storm direction or shrink radius.
2. Add 1–2 traversable objects (low walls, ramps) in zone x=512–576 so players have a faster crossing path.
3. Track time-of-death relative to storm boundary — if players die within 2 seconds of the boundary reaching them, the warning system needs tuning.

---

## Insight 2 — PvP Kills Are Almost Nonexistent: Bot Combat Dominates Every Map

### What caught my eye

Kill event counts by type show an extraordinary bot-to-human kill ratio. Across all 796 matches over five days, human-vs-human kills (`Kill`) account for only **3 events** out of **2,418 total recorded kills**.

### The numbers

| Map           | Bot Kills (BotKill) | PvP Kills (Kill) | Bot Kill % |
|---------------|---------------------|------------------|------------|
| AmbroseValley | 1,797               | 2                | 99.9%      |
| Lockdown      | 426                 | 0                | 100.0%     |
| GrandRift     | 192                 | 1                | 99.5%      |
| **Total**     | **2,415**           | **3**            | **99.9%**  |

Additionally, note that there are 339 unique players but most matches have 1 human and 14–15 bots. The near-total absence of PvP kills is partly structural — but three PvP kills across 566 AmbroseValley matches is still telling.

### Why a level designer should care

Two possible readings:

1. **Human players are avoiding each other** — they are successfully using the map to disengage from PvP, possibly because AmbroseValley and Lockdown offer too many evasion routes or extract early. This reduces the intended tension of the game.

2. **The dataset itself is from a low-population window** — with mostly single-human matches, human encounters are rare by chance. But even in matches where 2+ humans are present, PvP kills remain rare.

Either way, if LILA BLACK's design intent is extraction-shooter tension (fight AND extract), the maps should be stress-tested with 4–6 simultaneous human players. The current data suggests the "hunt or be hunted" dynamic is not manifesting at this player-density level.

### Actionable items

1. Instrument a "proximity event" to track how often human players come within combat range of each other without engaging — that would distinguish map-avoidance from low population.
2. GrandRift (59 matches) had the only cross-human kill in its dataset; evaluate whether its tighter geometry or funnel structure is nudging encounters. Apply similar design patterns to AmbroseValley.
3. Consider adjusting bot density in test builds to model higher human counts and see whether PvP emerges organically.

---

## Insight 3 — Loot Hot Spots Reveal Three Distinct Drop-Priority Zones on AmbroseValley

### What caught my eye

On AmbroseValley — the most-played map (566 matches, 72% of all matches) — the top five loot zones together hold **27.3% of all 9,955 loot events**, despite covering only ~2% of map area. The distribution is not random.

### The numbers

| Zone (grid)  | Pixel region (1024 px)    | Loot count | % of total |
|--------------|---------------------------|------------|------------|
| (5, 13)      | x=320–384, y=832–896      | 586        | 5.9%       |
| (8, 12)      | x=512–576, y=768–832      | 533        | 5.4%       |
| (1, 6)       | x=64–128, y=384–448       | 499        | 5.0%       |
| (9, 6)       | x=576–640, y=384–448      | 493        | 5.0%       |
| (6, 12)      | x=384–448, y=768–832      | 493        | 5.0%       |

Three structural clusters emerge:

- **South-centre cluster** (zones 5,13 + 8,12 + 6,12): three adjacent zones in the southern third of the map, all with ~530+ loot events. This is a dense, interconnected loot band.
- **West-mid zone** (1, 6): isolated on the map's left edge, mid-height — could be a secondary drop for players who want to avoid the south cluster.
- **East-mid zone** (9, 6): mirrors the west zone on the right side at the same y-elevation, suggesting a horizontal mid-map loot corridor.

On GrandRift, zone (7, 9) holds 10.1% of all loot — even more concentrated than AmbroseValley's top zone.

### Why a level designer should care

High loot concentration drives drop decisions. If experienced players all know zones (5,13), (8,12), and (6,12) dominate AmbroseValley loot, matches will be shaped by a race to the southern cluster — which compresses early-game player density into a small region and either creates chaotic early fights or leaves the rest of the map underutilized.

### Actionable items

1. **Redistribute loot spawn tables** in the south-centre cluster; cap the concentration difference between the richest and poorest quadrant to 2–3× rather than the current ~6×.
2. **Create a loot magnet** in the map's underplayed zones (north-east quadrant appears thin) — a unique item type or higher-tier chest — to pull players away from the south cluster.
3. **Cross-reference loot zones with early-game kills**: if most early kills happen in south-centre, the loot distribution is directly causing congested early fights. If not, players are successfully looting and disengaging — and the concentration is not a problem.
4. On GrandRift, zone (7,9) at 10.1% of total loot is extreme for a 59-match sample — validate whether this is a spawn-table bug or intended design.
