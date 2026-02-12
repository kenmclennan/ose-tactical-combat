import type { ActionId, ActionDefinition, ActionCategory } from "../types";

export const ACTIONS: Record<ActionId, ActionDefinition> = {
  wait: { id: "wait", name: "Wait", cost: 1, description: "Hold or set trigger to interrupt (not in melee)", category: "other" },
  "quick-action": { id: "quick-action", name: "Quick Action", cost: 2, description: "Draw/drop weapon, take cover, stand up, open door", category: "other" },
  "move-half": { id: "move-half", name: "Move (Half)", cost: 2, description: "Half encounter move (max 2 per round)", category: "move" },
  brace: { id: "brace", name: "Brace", cost: 2, description: "Ready vs charge; free attack if charged (spear/polearm)", category: "other" },
  "unarmed-attack": { id: "unarmed-attack", name: "Unarmed Attack", cost: 2, description: "1d2+STR damage", category: "act" },
  aid: { id: "aid", name: "Aid", cost: 2, description: "Ally gets +2 to next attack OR +2 AC until your next turn", category: "other" },
  guard: { id: "guard", name: "Guard", cost: 2, description: "Take attacks meant for adjacent ally (use your AC)", category: "other" },
  "coordinated-defence": { id: "coordinated-defence", name: "Coordinated Defence", cost: 2, description: "All in formation get +1 AC; pay each round; move together", category: "other" },
  "break-free": { id: "break-free", name: "Break Free", cost: 2, description: "Escape grapple (STR vs STR or DEX); includes half move", category: "other" },
  "move-full": { id: "move-full", name: "Move (Full)", cost: 3, description: "Full encounter move", category: "move" },
  attack: { id: "attack", name: "Attack", cost: 3, description: "Strike foe; melee or ranged", category: "act" },
  action: { id: "action", name: "Action", cost: 3, description: "Non-combat activity (drink potion, use item, etc.)", category: "other" },
  "fighting-withdrawal": { id: "fighting-withdrawal", name: "Fighting Withdrawal", cost: 3, description: "Half move backward, no AC penalty", category: "move" },
  grapple: { id: "grapple", name: "Grapple", cost: 3, description: "Opposed STR; win = grapple, lose = action wasted", category: "other" },
  "two-handed-attack": { id: "two-handed-attack", name: "Two-Handed Attack", cost: 4, description: "Strike with two-handed weapon", category: "act" },
  "cast-spell": { id: "cast-spell", name: "Cast Spell", cost: 4, description: "Cast a prepared spell", category: "act" },
  retreat: { id: "retreat", name: "Retreat", cost: 4, description: "Full move backward, foes get +2 to hit you", category: "move" },
  "coordinated-attack": { id: "coordinated-attack", name: "Coordinated Attack", cost: 4, description: "Attack with allies vs same target; +1 to hit, +1 damage per extra attacker", category: "other" },
  "aimed-shot": { id: "aimed-shot", name: "Aimed Shot", cost: 5, description: "Ranged attack with +2 to hit", category: "act" },
  charge: { id: "charge", name: "Charge", cost: 5, description: "Full move + attack, +2 to hit, -2 AC until next turn", category: "move" },
  "slow-action": { id: "slow-action", name: "Slow Action", cost: 6, description: "Complex non-combat activity (barricade door, bind wounds)", category: "other" },
  done: { id: "done", name: "Done", cost: 0, description: "Take no further actions this cycle. Remaining AP banks as Fury.", category: "other" },
};

export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  move: "Move",
  act: "Act",
  other: "Other",
};

export const CATEGORY_ORDER: ActionCategory[] = ["move", "act", "other"];

export const ACTION_LIST: ActionDefinition[] = Object.values(ACTIONS).sort(
  (a, b) => a.cost - b.cost || a.name.localeCompare(b.name),
);

export function getAction(id: ActionId): ActionDefinition {
  return ACTIONS[id];
}
