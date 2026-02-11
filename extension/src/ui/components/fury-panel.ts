import type { CombatState, FurySpendType } from "../../types";
import { saveState } from "../../state/store";
import { FURY_SPEND_OPTIONS, canSpendFury, appendFuryLog } from "../../rules/fury";
import { getCurrentAp } from "../../state/selectors";
import { showModal, closeModal } from "../modal";

export function showFuryModal(state: CombatState, playerId: string, isGM: boolean): void {
  const fury = state.fury.current;

  const playerView = `
    <div class="fury-modal-total">${fury}</div>
    <div class="fury-modal-label">Fury Points</div>
    <div class="fury-spend-buttons">
      ${FURY_SPEND_OPTIONS.map((opt) => `
        <button
          class="btn btn-sm fury-spend-btn"
          data-action="modal-spend-fury"
          data-spend-type="${opt.type}"
          data-cost="${opt.cost}"
          ${canSpendFury(fury, opt.type) ? "" : "disabled"}
        >
          ${opt.name} (${opt.cost})
        </button>
      `).join("")}
    </div>
  `;

  const gmView = `
    <div class="fury-modal-total">${fury}</div>
    <div class="fury-modal-label">Fury Points</div>
    <div class="fury-gm-controls">
      <input type="number" class="input-sm" id="fury-set-amount" value="${fury}" min="0" />
      <button class="btn btn-sm btn-primary" data-action="modal-set-fury">Update</button>
    </div>
  `;

  showModal(`
    <div class="modal-overlay" data-modal-overlay="true">
      <div class="modal fury-modal">
        <div class="modal-header">
          <span class="modal-title">Fury Pool</span>
          <button class="btn-icon" data-action="close-modal">&#x2715;</button>
        </div>
        <div class="modal-body" style="align-items: center; text-align: center;">
          ${isGM ? gmView : playerView}
        </div>
      </div>
    </div>
  `, (action, data) => {
    if (action === "modal-spend-fury") {
      const spendType = data.spendType as FurySpendType;
      const cost = parseInt(data.cost || "0");
      if (!canSpendFury(state.fury.current, spendType)) return;

      const roundNum = state.round?.roundNumber ?? 0;
      const newLog = appendFuryLog(state.fury.log, {
        type: "spend",
        amount: cost,
        spendType,
        round: roundNum,
      });

      const newState: CombatState = {
        ...state,
        fury: { current: state.fury.current - cost, log: newLog },
      };

      // For +1 AP, find the player's combatant and boost their AP
      if (spendType === "ap-boost") {
        const pc = state.combatants.find((c) => c.ownerId === playerId && c.side === "player" && c.status === "active");
        if (pc && newState.round) {
          const currentAp = getCurrentAp(state, pc.id);
          newState.round = {
            ...newState.round,
            apCurrent: { ...newState.round.apCurrent, [pc.id]: currentAp + 1 },
          };
        }
      }

      saveState(newState);
      closeModal();
    }

    if (action === "modal-set-fury" && isGM) {
      const input = document.querySelector("#fury-set-amount") as HTMLInputElement | null;
      if (!input) return;
      const val = parseInt(input.value);
      if (isNaN(val) || val < 0) return;

      const diff = val - state.fury.current;
      if (diff === 0) { closeModal(); return; }

      const roundNum = state.round?.roundNumber ?? 0;
      const newLog = appendFuryLog(state.fury.log, {
        type: diff > 0 ? "bank" : "spend",
        amount: Math.abs(diff),
        ...(diff < 0 ? { spendType: "custom" as FurySpendType } : {}),
        round: roundNum,
      });

      saveState({
        ...state,
        fury: { current: val, log: newLog },
      });
      closeModal();
    }
  });
}
