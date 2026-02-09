export type FurySpendType = "damage-boost" | "damage-reduce" | "ap-boost";

export interface FuryLogEntry {
  type: "bank" | "spend";
  amount: number;
  spendType?: FurySpendType;
  combatantId?: string;
  round: number;
}
