export type DexCategory = "penalty" | "standard" | "bonus";
export type CombatantSide = "player" | "monster";
export type CombatantStatus = "active" | "killed" | "incapacitated";

export interface CombatantStats {
  hpCurrent: number;
  hpMax: number;
  ac: number;
  thac0: number;
}

export interface Combatant {
  id: string;
  name: string;
  side: CombatantSide;
  status: CombatantStatus;
  stats: CombatantStats;
  dexCategory: DexCategory;
  apBase: number;
  apVariance: boolean;
  surprised: boolean;
  ownerId?: string;
  tokenId?: string;
}
