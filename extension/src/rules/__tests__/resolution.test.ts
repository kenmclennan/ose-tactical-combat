import { describe, it, expect } from "vitest";
import { buildResolutionOrder, deductCycleCosts } from "../resolution";
import {
  makeCombatant,
  makeCombatState,
  makeRound,
  makeDeclaration,
} from "../../__tests__/fixtures";

describe("buildResolutionOrder", () => {
  it("returns empty when no round", () => {
    const state = makeCombatState();
    expect(buildResolutionOrder(state)).toEqual([]);
  });

  it("orders by highest AP first", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "a" }),
        makeCombatant({ id: "b" }),
        makeCombatant({ id: "c" }),
      ],
      round: makeRound({
        apCurrent: { a: 5, b: 8, c: 3 },
        currentCycle: {
          cycleNumber: 1,
          declarations: [
            makeDeclaration({ combatantId: "a", locked: true }),
            makeDeclaration({ combatantId: "b", locked: true }),
            makeDeclaration({ combatantId: "c", locked: true }),
          ],
          resolutionOrder: [],
          currentResolutionIndex: 0,
        },
      }),
    });
    expect(buildResolutionOrder(state)).toEqual(["b", "a", "c"]);
  });

  it("excludes unlocked declarations", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" }), makeCombatant({ id: "b" })],
      round: makeRound({
        apCurrent: { a: 5, b: 8 },
        currentCycle: {
          cycleNumber: 1,
          declarations: [
            makeDeclaration({ combatantId: "a", locked: true }),
            makeDeclaration({ combatantId: "b", locked: false }),
          ],
          resolutionOrder: [],
          currentResolutionIndex: 0,
        },
      }),
    });
    expect(buildResolutionOrder(state)).toEqual(["a"]);
  });

  it("ties preserve array order (simultaneous)", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" }), makeCombatant({ id: "b" })],
      round: makeRound({
        apCurrent: { a: 5, b: 5 },
        currentCycle: {
          cycleNumber: 1,
          declarations: [
            makeDeclaration({ combatantId: "a", locked: true }),
            makeDeclaration({ combatantId: "b", locked: true }),
          ],
          resolutionOrder: [],
          currentResolutionIndex: 0,
        },
      }),
    });
    const order = buildResolutionOrder(state);
    expect(order).toHaveLength(2);
    expect(order).toContain("a");
    expect(order).toContain("b");
  });
});

describe("deductCycleCosts", () => {
  it("subtracts cost for resolved declarations", () => {
    const ap = { a: 7, b: 5 };
    const decls = [
      makeDeclaration({ combatantId: "a", cost: 3, resolved: true }),
      makeDeclaration({ combatantId: "b", cost: 2, resolved: true }),
    ];
    expect(deductCycleCosts(ap, decls)).toEqual({ a: 4, b: 3 });
  });

  it("floors AP at 0", () => {
    const ap = { a: 2 };
    const decls = [makeDeclaration({ combatantId: "a", cost: 5, resolved: true })];
    expect(deductCycleCosts(ap, decls)).toEqual({ a: 0 });
  });

  it("skips unresolved declarations", () => {
    const ap = { a: 7 };
    const decls = [makeDeclaration({ combatantId: "a", cost: 3, resolved: false })];
    expect(deductCycleCosts(ap, decls)).toEqual({ a: 7 });
  });

  it("done action costs 0", () => {
    const ap = { a: 4 };
    const decls = [
      makeDeclaration({
        combatantId: "a",
        actionId: "done",
        cost: 0,
        resolved: true,
      }),
    ];
    expect(deductCycleCosts(ap, decls)).toEqual({ a: 4 });
  });

  it("does not mutate original map", () => {
    const ap = { a: 7 };
    const decls = [makeDeclaration({ combatantId: "a", cost: 3, resolved: true })];
    deductCycleCosts(ap, decls);
    expect(ap.a).toBe(7);
  });
});
