import OBR from "@owlbear-rodeo/sdk";
import type { DiceRoller, DiceResult } from "./roller";

const DICE_PLUS_CHANNEL = "com.battle-system.dice/results";
const DICE_PLUS_READY_CHANNEL = "com.battle-system.dice/ready";
const DICE_PLUS_ROLL_CHANNEL = "com.battle-system.dice/roll";

/**
 * Dice extension integration via OBR Broadcast API.
 * Sends roll requests and listens for results.
 */
export class DicePlusRoller implements DiceRoller {
  readonly name = "Owlbear Dice";
  private pendingResolve: ((result: DiceResult) => void) | null = null;

  async isReady(): Promise<boolean> {
    return true;
  }

  async roll(notation: string, label?: string): Promise<DiceResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResolve = null;
        reject(new Error("Dice roll timed out"));
      }, 10000);

      this.pendingResolve = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };

      OBR.broadcast.sendMessage(DICE_PLUS_ROLL_CHANNEL, {
        notation,
        label: label || "AP Variance",
      });
    });
  }

  startListening(): () => void {
    return OBR.broadcast.onMessage(DICE_PLUS_CHANNEL, (event) => {
      if (this.pendingResolve && event.data) {
        const data = event.data as { total?: number; rolls?: number[] };
        this.pendingResolve({
          total: data.total ?? 0,
          rolls: data.rolls ?? [],
        });
        this.pendingResolve = null;
      }
    });
  }
}

/**
 * Detect if the Dice extension is available.
 * Sends a ready check and waits 2 seconds for response.
 */
export async function detectDiceExtension(): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, 2000);

    const unsubscribe = OBR.broadcast.onMessage(DICE_PLUS_READY_CHANNEL, () => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(true);
    });

    OBR.broadcast.sendMessage(DICE_PLUS_READY_CHANNEL, { query: true });
  });
}
