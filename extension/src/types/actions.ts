export type ActionId =
  | "wait"
  | "quick-action"
  | "move-half"
  | "brace"
  | "unarmed-attack"
  | "aid"
  | "guard"
  | "coordinated-defence"
  | "break-free"
  | "move-full"
  | "attack"
  | "action"
  | "fighting-withdrawal"
  | "grapple"
  | "two-handed-attack"
  | "cast-spell"
  | "retreat"
  | "coordinated-attack"
  | "aimed-shot"
  | "charge"
  | "slow-action";

export interface ActionDefinition {
  id: ActionId;
  name: string;
  cost: number;
  description: string;
}
