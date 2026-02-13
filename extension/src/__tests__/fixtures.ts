import type {
  Combatant,
  CombatState,
  RoundState,
  CombatPhase,
  Declaration,
} from "../types";

export function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: "c1",
    name: "Fighter",
    side: "player",
    status: "active",
    stats: { hpCurrent: 10, hpMax: 10, ac: 5, thac0: 17 },
    dexCategory: "standard",
    apBase: 7,
    apVariance: true,
    surprised: false,
    ...overrides,
  };
}

export function makeRound(overrides: Partial<RoundState> = {}): RoundState {
  return {
    roundNumber: 1,
    apRolls: {},
    apCurrent: {},
    currentCycle: {
      cycleNumber: 1,
      declarations: [],
      resolutionOrder: [],
      currentResolutionIndex: 0,
    },
    completedCycles: 0,
    doneForRound: [],
    ...overrides,
  };
}

export function makeCombatState(
  overrides: Partial<CombatState> = {},
): CombatState {
  return {
    version: 1,
    phase: "setup" as CombatPhase,
    combatants: [],
    round: null,
    fury: { current: 0, log: [] },
    gmId: "gm1",
    ...overrides,
  };
}

export function makeDeclaration(
  overrides: Partial<Declaration> = {},
): Declaration {
  return {
    combatantId: "c1",
    actionId: "attack",
    cost: 3,
    locked: false,
    ...overrides,
  };
}
