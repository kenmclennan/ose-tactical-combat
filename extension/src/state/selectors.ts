import type { CombatState, Combatant, Declaration, ActionDefinition } from "../types";
import { ACTION_LIST } from "../rules/actions";

export function getActiveCombatants(state: CombatState): Combatant[] {
  return state.combatants.filter((c) => c.status === "active");
}

export function getCombatantById(state: CombatState, id: string): Combatant | undefined {
  return state.combatants.find((c) => c.id === id);
}

export function getPlayerCombatants(state: CombatState): Combatant[] {
  return state.combatants.filter((c) => c.side === "player");
}

export function getMonsterCombatants(state: CombatState): Combatant[] {
  return state.combatants.filter((c) => c.side === "monster");
}

export function getCurrentAp(state: CombatState, combatantId: string): number {
  return state.round?.apCurrent[combatantId] ?? 0;
}

export function getAffordableActions(state: CombatState, combatantId: string): ActionDefinition[] {
  const ap = getCurrentAp(state, combatantId);
  return ACTION_LIST.filter((a) => a.cost <= ap);
}

export function getDeclaration(state: CombatState, combatantId: string): Declaration | undefined {
  return state.round?.currentCycle.declarations.find((d) => d.combatantId === combatantId);
}

export function isDoneForRound(state: CombatState, combatantId: string): boolean {
  return state.round?.doneForRound?.includes(combatantId) ?? false;
}

export function allDeclarationsLocked(state: CombatState): boolean {
  const active = getActiveCombatants(state);
  const cycle = state.round?.currentCycle;
  if (!cycle) return false;
  return active.every((c) => {
    if (isDoneForRound(state, c.id)) return true;
    const ap = getCurrentAp(state, c.id);
    if (ap < 1) return true;
    const decl = cycle.declarations.find((d) => d.combatantId === c.id);
    return decl?.locked === true;
  });
}

export function anyoneCanAct(state: CombatState): boolean {
  const active = getActiveCombatants(state);
  return active.some((c) => {
    if (isDoneForRound(state, c.id)) return false;
    return getCurrentAp(state, c.id) >= 1;
  });
}

export function getResolutionOrder(state: CombatState): string[] {
  return state.round?.currentCycle.resolutionOrder ?? [];
}
