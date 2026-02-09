export interface DiceResult {
  total: number;
  rolls: number[];
  label?: string;
}

export interface DiceRoller {
  roll(notation: string, label?: string): Promise<DiceResult>;
  isReady(): Promise<boolean>;
  readonly name: string;
}

/**
 * Built-in dice roller using Math.random().
 * Used as default/fallback. Dice extension integration in TACS-005.
 */
export class BuiltInRoller implements DiceRoller {
  readonly name = "Built-in";

  async isReady(): Promise<boolean> {
    return true;
  }

  async roll(notation: string, label?: string): Promise<DiceResult> {
    const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }

    const count = parseInt(match[1] || "1");
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3] || "0");

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, r) => sum + r, 0) + modifier;
    return { total, rolls, label };
  }
}

let defaultRoller: DiceRoller = new BuiltInRoller();

export function getRoller(): DiceRoller {
  return defaultRoller;
}

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}
