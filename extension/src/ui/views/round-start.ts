import type { CombatState, Combatant } from "../../types";
import { saveState } from "../../state/store";
import { getActiveCombatants } from "../../state/selectors";
import { computeStartingAp } from "../../rules/ap";
import { rollD6 } from "../../dice/roller";

export function renderRoundStartView(
  state: CombatState,
  _playerId: string,
  isGM: boolean,
): string {
  const active = getActiveCombatants(state);
  const round = state.round!;
  const allRolled = active.every((c) => round.apRolls[c.id] !== undefined);

  return `
    <div class="round-start-view">
      <div class="round-header">Round ${round.roundNumber}</div>
      <div class="ap-roll-list">
        ${active.map((c) => renderApRoll(c, round.apRolls[c.id], round.apCurrent[c.id])).join("")}
      </div>
      ${isGM ? `
        <div class="round-actions">
          ${!allRolled ? `
            <button class="btn btn-primary btn-full" data-action="roll-all-ap">Roll AP Variance</button>
          ` : `
            <button class="btn btn-primary btn-full" data-action="begin-declaration">Begin Declaration</button>
          `}
        </div>
      ` : `
        <div class="hint">${allRolled ? "Waiting for GM to begin declaration..." : "Waiting for AP rolls..."}</div>
      `}
    </div>
  `;
}

function renderApRoll(c: Combatant, roll: number | undefined, ap: number | undefined): string {
  const hasRoll = roll !== undefined;
  const statusClass = c.status !== "active" ? "combatant-dead" : "";

  return `
    <div class="ap-roll-row ${statusClass}">
      <span class="combatant-name">${escapeHtml(c.name)}</span>
      <div class="ap-roll-result">
        ${c.status !== "active" ? `<span class="stat muted">Out</span>` :
          c.surprised ? `<span class="ap-value surprised-ap">${ap ?? "?"} AP</span><span class="badge badge-warning">Surprised</span>` :
          hasRoll ? `<span class="die-result">[${roll}]</span><span class="ap-value">${ap} AP</span>` :
          `<span class="ap-value pending">--</span>`
        }
      </div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function bindRoundStartEvents(
  container: HTMLElement,
  state: CombatState,
  _playerId: string,
  isGM: boolean,
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;

    if (action === "roll-all-ap" && isGM) {
      rollAllAp(state);
    }
    if (action === "begin-declaration" && isGM) {
      beginDeclaration(state);
    }
  });
}

function rollAllAp(state: CombatState): void {
  const active = getActiveCombatants(state);
  const round = { ...state.round! };
  const apRolls: Record<string, number> = {};
  const apCurrent: Record<string, number> = {};

  for (const c of active) {
    if (c.status !== "active") continue;

    const roll = rollD6();
    apRolls[c.id] = roll;
    apCurrent[c.id] = computeStartingAp(
      c.apBase,
      roll,
      c.dexCategory,
      c.apVariance,
      c.surprised,
    );
  }

  saveState({
    ...state,
    round: { ...round, apRolls, apCurrent },
  });
}

function beginDeclaration(state: CombatState): void {
  saveState({
    ...state,
    phase: "declaration",
    round: {
      ...state.round!,
      currentCycle: {
        cycleNumber: state.round!.currentCycle.cycleNumber,
        declarations: [],
        resolutionOrder: [],
        currentResolutionIndex: 0,
      },
    },
  });
}
