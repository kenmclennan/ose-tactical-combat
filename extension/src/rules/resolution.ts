import type { CombatState, Declaration } from "../types";
import { getCurrentAp } from "../state/selectors";
import { getAction } from "./actions";

/**
 * Build resolution order: highest current AP first.
 * Ties are simultaneous (grouped at same index conceptually,
 * but stored flat - UI handles tie display).
 */
export function buildResolutionOrder(state: CombatState): string[] {
  const cycle = state.round?.currentCycle;
  if (!cycle) return [];

  const declared = cycle.declarations
    .filter((d) => d.locked)
    .map((d) => ({
      combatantId: d.combatantId,
      ap: getCurrentAp(state, d.combatantId),
    }));

  declared.sort((a, b) => b.ap - a.ap);
  return declared.map((d) => d.combatantId);
}

/**
 * Deduct AP costs for all resolved declarations in the current cycle.
 * Returns updated apCurrent map.
 */
export function deductCycleCosts(
  apCurrent: Record<string, number>,
  declarations: Declaration[],
): Record<string, number> {
  const updated = { ...apCurrent };
  for (const decl of declarations) {
    if (decl.resolved) {
      updated[decl.combatantId] = Math.max(0, (updated[decl.combatantId] ?? 0) - decl.cost);
    }
  }
  return updated;
}

/**
 * Deduct move costs for all resolved declarations in the current cycle.
 * Returns updated movesUsed map.
 */
export function deductCycleMoveCosts(
  movesUsed: Record<string, number>,
  declarations: Declaration[],
): Record<string, number> {
  const updated = { ...movesUsed };
  for (const decl of declarations) {
    if (decl.resolved) {
      const action = getAction(decl.actionId);
      if (action.moveCost > 0) {
        updated[decl.combatantId] = (updated[decl.combatantId] ?? 0) + action.moveCost;
      }
    }
  }
  return updated;
}
