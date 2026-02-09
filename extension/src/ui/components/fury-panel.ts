import type { CombatState, FurySpendType } from "../../types";
import { saveState } from "../../state/store";
import { FURY_SPEND_OPTIONS, canSpendFury, appendFuryLog } from "../../rules/fury";

export function renderFuryPanel(state: CombatState, isPlayer: boolean): string {
  const fury = state.fury.current;
  if (fury <= 0 && !isPlayer) return "";

  return `
    <div class="fury-panel">
      <div class="fury-header">
        <span class="section-title">Fury Pool</span>
        <span class="fury-total">${fury}</span>
      </div>
      ${isPlayer ? `
        <div class="fury-spend-buttons">
          ${FURY_SPEND_OPTIONS.map((opt) => `
            <button
              class="btn btn-sm fury-spend-btn"
              data-action="spend-fury"
              data-spend-type="${opt.type}"
              data-cost="${opt.cost}"
              ${canSpendFury(fury, opt.type) ? "" : "disabled"}
              title="${opt.effect}"
            >
              ${opt.name} (${opt.cost})
            </button>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

export function bindFuryEvents(
  container: HTMLElement,
  state: CombatState,
  playerId: string,
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action='spend-fury']") as HTMLElement | null;
    if (!target) return;

    const spendType = target.dataset.spendType as FurySpendType;
    const cost = parseInt(target.dataset.cost || "0");

    if (!canSpendFury(state.fury.current, spendType)) return;

    const roundNum = state.round?.roundNumber ?? 0;
    const newLog = appendFuryLog(state.fury.log, {
      type: "spend",
      amount: cost,
      spendType,
      round: roundNum,
    });

    let updatedState: CombatState = {
      ...state,
      fury: {
        current: state.fury.current - cost,
        log: newLog,
      },
    };

    // If AP boost, add AP to... we need a target combatant.
    // For now, the AP boost is tracked via fury log. GM applies manually.
    // The rules say "+1 AP to your current pool" - player can spend at any time.

    saveState(updatedState);
  });
}
