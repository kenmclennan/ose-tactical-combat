import type { CombatState, FuryLogEntry, FurySpendType } from "../types";
import { FURY_AP_PER_POINT, FURY_LOG_MAX } from "../util/constants";
import { getPlayerCombatants, getCurrentAp } from "../state/selectors";

export interface FurySpendOption {
  type: FurySpendType;
  name: string;
  cost: number;
  effect: string;
}

export const FURY_SPEND_OPTIONS: FurySpendOption[] = [
  { type: "damage-boost", name: "+1 Damage", cost: 1, effect: "+1 damage to a successful attack" },
  { type: "damage-reduce", name: "-1 Damage", cost: 2, effect: "-1 damage from incoming attack" },
  { type: "ap-boost", name: "+1 AP", cost: 3, effect: "+1 AP to your current pool" },
];

export function calculateFuryBanked(state: CombatState): number {
  const players = getPlayerCombatants(state).filter(
    (c) => c.status === "active",
  );
  let total = 0;
  for (const p of players) {
    const leftover = getCurrentAp(state, p.id);
    total += Math.floor(leftover / FURY_AP_PER_POINT);
  }
  return total;
}

export function canSpendFury(
  currentFury: number,
  spendType: FurySpendType,
): boolean {
  const option = FURY_SPEND_OPTIONS.find((o) => o.type === spendType);
  if (!option) return false;
  return currentFury >= option.cost;
}

export function appendFuryLog(
  log: FuryLogEntry[],
  entry: FuryLogEntry,
): FuryLogEntry[] {
  const updated = [...log, entry];
  if (updated.length > FURY_LOG_MAX) {
    return updated.slice(updated.length - FURY_LOG_MAX);
  }
  return updated;
}
