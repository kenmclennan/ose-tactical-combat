import type { Combatant } from "./combatant";
import type { ActionId } from "./actions";
import type { FuryLogEntry } from "./fury";

export type CombatPhase =
  | "setup"
  | "round-start"
  | "declaration"
  | "resolution"
  | "cycle-end"
  | "round-end"
  | "combat-end";

export interface Declaration {
  combatantId: string;
  actionId: ActionId;
  cost: number;
  locked: boolean;
  resolved?: boolean;
}

export interface CycleState {
  cycleNumber: number;
  declarations: Declaration[];
  resolutionOrder: string[];
  currentResolutionIndex: number;
}

export interface RoundState {
  roundNumber: number;
  apRolls: Record<string, number>;
  apCurrent: Record<string, number>;
  movesUsed: Record<string, number>;
  currentCycle: CycleState;
  completedCycles: number;
  doneForRound: string[];
}

export interface FuryState {
  current: number;
  log: FuryLogEntry[];
}

export interface CombatState {
  version: 1;
  phase: CombatPhase;
  combatants: Combatant[];
  round: RoundState | null;
  fury: FuryState;
  gmId: string;
}
