import type { CombatState, Combatant } from "../../types";
import { saveState } from "../../state/store";
import { getCurrentAp } from "../../state/selectors";
import { showModal, closeModal } from "../modal";

export interface CardOptions {
  showAp: boolean;
  showEdit: boolean;
  showStatusToggle: boolean;
  showRemove?: boolean;
  isGM: boolean;
  isOwner: boolean;
  playerId: string;
  extraActions?: string;
  extraStats?: string;
  ownerName?: string;
  dieResult?: number;
}

export function renderCombatantCard(
  c: Combatant,
  state: CombatState,
  opts: CardOptions,
): string {
  const isOut = c.status !== "active";
  const ap = opts.showAp ? getCurrentAp(state, c.id) : null;
  const canEdit = opts.isGM || opts.isOwner;
  const showStats = opts.isGM || c.side === "player";

  return `
    <div class="combatant-card ${isOut ? "combatant-out" : ""}" data-combatant-id="${c.id}">
      <div class="card-header">
        <span class="combatant-name">${escapeHtml(c.name)}${opts.ownerName ? ` <span class="owner-name">(${escapeHtml(opts.ownerName)})</span>` : ""}</span>
        <div class="card-actions">
          ${isOut ? `<span class="badge badge-danger">Out</span>` : ""}
          ${canEdit && opts.showEdit ? `<button class="btn-icon" data-action="edit-combatant" data-id="${c.id}" title="Edit">&#x270E;</button>` : ""}
          ${opts.isGM && opts.showRemove ? `<button class="btn-icon btn-danger-icon" data-action="remove-combatant" data-id="${c.id}" title="Remove">&#x2715;</button>` : ""}
          ${opts.isGM && opts.showStatusToggle ? `
            <button class="btn-icon ${isOut ? "btn-restore-icon" : "btn-danger-icon"}" data-action="toggle-status" data-id="${c.id}" title="${isOut ? "Restore" : "Out of Action"}">
              ${isOut ? "&#x2764;" : "&#x2620;"}
            </button>
          ` : ""}
          ${opts.extraActions ?? ""}
        </div>
      </div>
      ${showStats ? `
        <div class="card-stats">
          <span class="stat stat-hp" data-id="${c.id}">HP <span class="hp-value ${canEdit ? "editable" : ""}" data-action="${canEdit ? "edit-hp" : ""}" data-id="${c.id}">${c.stats.hpCurrent}</span>/${c.stats.hpMax}</span>
          <span class="stat">AC ${c.stats.ac}</span>
          <span class="stat">THAC0 ${c.stats.thac0}</span>
          ${ap !== null ? `
            <span class="stat stat-ap">
              <span class="${canEdit ? "ap-editable" : ""}" data-action="${canEdit ? "edit-ap" : ""}" data-id="${c.id}">${ap}</span> AP
            </span>
          ` : ""}
          ${ap !== null && opts.dieResult !== undefined ? `<span class="stat die-result">[${opts.dieResult}]</span>` : ""}
          ${opts.extraStats ?? ""}
        </div>
      ` : `
        <div class="card-stats">
          ${ap !== null ? `<span class="stat stat-ap">${ap} AP</span>` : ""}
          ${ap !== null && opts.dieResult !== undefined ? `<span class="stat die-result">[${opts.dieResult}]</span>` : ""}
          ${opts.extraStats ?? ""}
          <span class="stat muted">Stats hidden</span>
        </div>
      `}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function bindCardEvents(
  container: HTMLElement,
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: { id: string; name: string }[] = [],
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === "toggle-status" && id && isGM) {
      toggleCombatantStatus(state, id);
    }

    if (action === "edit-hp" && id) {
      showHpEditModal(state, id, playerId, isGM);
    }

    if (action === "edit-ap" && id) {
      const c = state.combatants.find((c) => c.id === id);
      if (c && (isGM || c.ownerId === playerId)) {
        showApEditModal(state, id);
      }
    }
  });
}

function toggleCombatantStatus(state: CombatState, id: string): void {
  const combatants = state.combatants.map((c) => {
    if (c.id !== id) return c;
    return {
      ...c,
      status: c.status === "active" ? ("incapacitated" as const) : ("active" as const),
    };
  });
  const newState: CombatState = { ...state, combatants };
  // Zero AP when toggling to incapacitated
  const toggled = combatants.find((c) => c.id === id);
  if (toggled?.status === "incapacitated" && newState.round) {
    newState.round = {
      ...newState.round,
      apCurrent: { ...newState.round.apCurrent, [id]: 0 },
    };
  }
  saveState(newState);
}

function showHpEditModal(state: CombatState, id: string, playerId: string, isGM: boolean): void {
  const c = state.combatants.find((c) => c.id === id);
  if (!c) return;
  const canEdit = isGM || c.ownerId === playerId;
  if (!canEdit) return;

  const current = c.stats.hpCurrent;

  showModal(`
    <div class="modal-overlay" data-modal-overlay="true">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Edit HP for ${escapeHtml(c.name)}</span>
          <button class="btn-icon" data-action="close-modal">&#x2715;</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Hit Points</label>
          <input type="number" class="input" data-field="hp" min="0" max="${c.stats.hpMax}" value="${current}" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" data-action="save-edit-hp" data-id="${id}">Save</button>
        </div>
      </div>
    </div>
  `, (action) => {
    if (action === "save-edit-hp") {
      const modal = document.querySelector(".modal-overlay");
      const input = modal?.querySelector('[data-field="hp"]') as HTMLInputElement | null;
      if (!input) return;

      const val = parseInt(input.value);
      if (isNaN(val) || val < 0) return;

      const combatants = state.combatants.map((existing) =>
        existing.id === id
          ? { ...existing, stats: { ...existing.stats, hpCurrent: Math.min(val, existing.stats.hpMax) } }
          : existing,
      );
      saveState({ ...state, combatants });
      closeModal();
    }
  });
}

export function showApEditModal(state: CombatState, id: string): void {
  if (!state.round) return;
  const c = state.combatants.find((c) => c.id === id);
  if (!c) return;
  const current = state.round.apCurrent[id] ?? 0;

  showModal(`
    <div class="modal-overlay" data-modal-overlay="true">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Edit AP for ${escapeHtml(c.name)}</span>
          <button class="btn-icon" data-action="close-modal">&#x2715;</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Action Points</label>
          <input type="number" class="input" data-field="ap" min="0" value="${current}" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" data-action="save-edit-ap" data-id="${id}">Save</button>
        </div>
      </div>
    </div>
  `, (action) => {
    if (action === "save-edit-ap") {
      const modal = document.querySelector(".modal-overlay");
      const input = modal?.querySelector('[data-field="ap"]') as HTMLInputElement | null;
      if (!input) return;

      const val = parseInt(input.value);
      if (isNaN(val) || val < 0) return;

      saveState({
        ...state,
        round: {
          ...state.round!,
          apCurrent: { ...state.round!.apCurrent, [id]: val },
        },
      });
      closeModal();
    }
  });
}
