import type { CombatState } from "./combat";

export const METADATA_KEY = "com.ose-tactical-initiative/state";
export const ROSTER_KEY = "com.ose-tactical-initiative/roster";

export type RoomMetadata = Record<string, unknown>;

export interface MetadataWithCombat extends RoomMetadata {
  [METADATA_KEY]?: CombatState;
}
