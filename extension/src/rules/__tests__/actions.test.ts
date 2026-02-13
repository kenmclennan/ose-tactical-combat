import { describe, it, expect } from "vitest";
import { ACTIONS, ACTION_LIST, getAction, CATEGORY_ORDER } from "../actions";
import type { ActionCategory, ActionId } from "../../types";

describe("ACTION_LIST", () => {
  it("is sorted by displayOrder", () => {
    for (let i = 1; i < ACTION_LIST.length; i++) {
      expect(ACTION_LIST[i].displayOrder).toBeGreaterThanOrEqual(
        ACTION_LIST[i - 1].displayOrder,
      );
    }
  });

  it("contains all actions from ACTIONS", () => {
    expect(ACTION_LIST).toHaveLength(Object.keys(ACTIONS).length);
  });
});

describe("getAction", () => {
  it("returns correct definition for each action ID", () => {
    const ids = Object.keys(ACTIONS) as ActionId[];
    for (const id of ids) {
      const action = getAction(id);
      expect(action.id).toBe(id);
      expect(action.name).toBeTruthy();
      expect(action.cost).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("action definitions", () => {
  const ids = Object.keys(ACTIONS) as ActionId[];

  it("all 22 actions exist", () => {
    expect(ids).toHaveLength(22);
  });

  it("all actions have required fields", () => {
    for (const id of ids) {
      const a = ACTIONS[id];
      expect(a.id).toBe(id);
      expect(typeof a.name).toBe("string");
      expect(typeof a.cost).toBe("number");
      expect(typeof a.description).toBe("string");
      expect(typeof a.category).toBe("string");
      expect(typeof a.displayOrder).toBe("number");
    }
  });

  it("categories are valid", () => {
    const validCategories = new Set<ActionCategory>(CATEGORY_ORDER);
    for (const id of ids) {
      expect(validCategories.has(ACTIONS[id].category)).toBe(true);
    }
  });

  it("done action costs 0", () => {
    expect(ACTIONS.done.cost).toBe(0);
  });

  it("move actions are in move category", () => {
    const moveIds: ActionId[] = [
      "move-half",
      "move-full",
      "fighting-withdrawal",
      "retreat",
      "charge",
    ];
    for (const id of moveIds) {
      expect(ACTIONS[id].category).toBe("move");
    }
  });

  it("attack actions are in act category", () => {
    const actIds: ActionId[] = [
      "unarmed-attack",
      "attack",
      "two-handed-attack",
      "cast-spell",
      "aimed-shot",
      "coordinated-attack",
    ];
    for (const id of actIds) {
      expect(ACTIONS[id].category).toBe("act");
    }
  });
});
