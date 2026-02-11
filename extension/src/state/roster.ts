import OBR from "@owlbear-rodeo/sdk";
import type { Combatant } from "../types";
import { ROSTER_KEY } from "../types";

export interface RosterEntry {
  name: string;
  side: "player";
  stats: Combatant["stats"];
  dexCategory: Combatant["dexCategory"];
  apBase: number;
  apVariance: boolean;
  ownerId?: string;
}

function combatantToRoster(c: Combatant): RosterEntry {
  return {
    name: c.name,
    side: "player",
    stats: { ...c.stats },
    dexCategory: c.dexCategory,
    apBase: c.apBase,
    apVariance: c.apVariance,
    ownerId: c.ownerId,
  };
}

export function rosterToCombatant(entry: RosterEntry, id: string): Combatant {
  return {
    id,
    name: entry.name,
    side: "player",
    status: "active",
    stats: { ...entry.stats },
    dexCategory: entry.dexCategory,
    apBase: entry.apBase,
    apVariance: entry.apVariance,
    surprised: false,
    ownerId: entry.ownerId,
  };
}

export async function saveRoster(players: Combatant[]): Promise<void> {
  const entries = players
    .filter((c) => c.side === "player")
    .map(combatantToRoster);
  await OBR.room.setMetadata({ [ROSTER_KEY]: entries });
}

export async function loadRoster(): Promise<RosterEntry[]> {
  const metadata = await OBR.room.getMetadata();
  const raw = metadata[ROSTER_KEY];
  if (!Array.isArray(raw)) return [];
  return raw as RosterEntry[];
}
