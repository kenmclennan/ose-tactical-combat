import type { DiceRoller } from "./roller";
import { BuiltInRoller } from "./roller";
import { DicePlusRoller, detectDiceExtension } from "./dice-plus";

let cachedRoller: DiceRoller | null = null;

export async function getAvailableRoller(): Promise<DiceRoller> {
  if (cachedRoller) return cachedRoller;

  const hasDicePlus = await detectDiceExtension();
  if (hasDicePlus) {
    const roller = new DicePlusRoller();
    roller.startListening();
    cachedRoller = roller;
  } else {
    cachedRoller = new BuiltInRoller();
  }

  return cachedRoller;
}

export function resetDetection(): void {
  cachedRoller = null;
}
