import type { CombatState, FurySpendType } from "../../types";
import { saveState } from "../../state/store";
import { FURY_SPEND_OPTIONS, canSpendFury, appendFuryLog } from "../../rules/fury";

export function renderFuryPanel(state: CombatState, isGM: boolean): string {
  const fury = state.fury.current;
  if (fury <= 0) return "";

  return `
    <div class="fury-panel">
      <div class="fury-header">
        <span class="section-title">Fury Pool</span>
        <span class="fury-total">${fury}</span>
      </div>
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
      <div class="fury-custom-row">
        <input type="number" class="input-sm" id="fury-custom-amount" min="1" max="${fury}" placeholder="Amount" />
        <button class="btn btn-sm btn-secondary" data-action="spend-fury-custom" ${fury > 0 ? "" : "disabled"}>
          Spend
        </button>
      </div>
      ${isGM ? `
        <div class="fury-gm-row">
          <input type="number" class="input-sm" id="fury-add-amount" min="1" placeholder="Add" />
          <button class="btn btn-sm btn-accent" data-action="add-fury">Add Fury</button>
        </div>
      ` : ""}
    </div>
  `;
}

export function bindFuryEvents(
  container: HTMLElement,
  state: CombatState,
  playerId: string,
  isGM: boolean,
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;

    if (action === "spend-fury") {
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

      saveState({
        ...state,
        fury: {
          current: state.fury.current - cost,
          log: newLog,
        },
      });
    }

    if (action === "spend-fury-custom") {
      const input = container.querySelector("#fury-custom-amount") as HTMLInputElement | null;
      if (!input) return;
      const amount = parseInt(input.value);
      if (isNaN(amount) || amount < 1 || amount > state.fury.current) return;

      const roundNum = state.round?.roundNumber ?? 0;
      const newLog = appendFuryLog(state.fury.log, {
        type: "spend",
        amount,
        spendType: "custom",
        round: roundNum,
      });

      saveState({
        ...state,
        fury: {
          current: state.fury.current - amount,
          log: newLog,
        },
      });
    }

    if (action === "add-fury" && isGM) {
      const input = container.querySelector("#fury-add-amount") as HTMLInputElement | null;
      if (!input) return;
      const amount = parseInt(input.value);
      if (isNaN(amount) || amount < 1) return;

      const roundNum = state.round?.roundNumber ?? 0;
      const newLog = appendFuryLog(state.fury.log, {
        type: "bank",
        amount,
        round: roundNum,
      });

      saveState({
        ...state,
        fury: {
          current: state.fury.current + amount,
          log: newLog,
        },
      });
    }
  });
}
