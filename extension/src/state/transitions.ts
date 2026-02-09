import type { CombatPhase } from "../types";

const VALID_TRANSITIONS: Record<CombatPhase, CombatPhase[]> = {
  setup: ["round-start"],
  "round-start": ["declaration"],
  declaration: ["resolution"],
  resolution: ["cycle-end"],
  "cycle-end": ["declaration", "round-end"],
  "round-end": ["round-start", "combat-end"],
  "combat-end": ["setup"],
};

export function canTransition(
  from: CombatPhase,
  to: CombatPhase,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: CombatPhase): CombatPhase[] {
  return VALID_TRANSITIONS[from] ?? [];
}
