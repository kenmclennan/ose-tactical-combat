import type { CombatState, Combatant } from "../../types";
import { saveState } from "../../state/store";
import { getCurrentAp } from "../../state/selectors";

export interface CardOptions {
  showAp: boolean;
  showEdit: boolean;
  showStatusToggle: boolean;
  isGM: boolean;
  isOwner: boolean;
  playerId: string;
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
        <span class="combatant-name">${escapeHtml(c.name)}</span>
        <div class="card-actions">
          ${isOut ? `<span class="badge badge-danger">Out</span>` : ""}
          ${canEdit && opts.showEdit ? `<button class="btn-icon" data-action="edit-combatant" data-id="${c.id}" title="Edit">&#x270E;</button>` : ""}
          ${opts.isGM && opts.showStatusToggle ? `
            <button class="btn-icon ${isOut ? "btn-restore-icon" : "btn-danger-icon"}" data-action="toggle-status" data-id="${c.id}" title="${isOut ? "Restore" : "Out of Action"}">
              ${isOut ? "&#x2764;" : "&#x2620;"}
            </button>
          ` : ""}
        </div>
      </div>
      ${showStats ? `
        <div class="card-stats">
          <span class="stat stat-hp" data-id="${c.id}">HP <span class="hp-value ${canEdit ? "editable" : ""}" data-action="${canEdit ? "edit-hp" : ""}" data-id="${c.id}">${c.stats.hpCurrent}</span>/${c.stats.hpMax}</span>
          <span class="stat">AC ${c.stats.ac}</span>
          <span class="stat">THAC0 ${c.stats.thac0}</span>
          ${ap !== null ? `
            <span class="stat stat-ap">
              <span class="${opts.isGM ? "ap-editable" : ""}" data-action="${opts.isGM ? "edit-ap" : ""}" data-id="${c.id}">${ap}</span> AP
            </span>
          ` : ""}
        </div>
      ` : `
        <div class="card-stats">
          ${ap !== null ? `<span class="stat stat-ap">${ap} AP</span>` : ""}
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
      showInlineHpEdit(target, state, id, playerId, isGM);
    }

    if (action === "edit-ap" && id && isGM) {
      showInlineApEdit(target, state, id);
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
  saveState({ ...state, combatants });
}

function showInlineHpEdit(el: HTMLElement, state: CombatState, id: string, playerId: string, isGM: boolean): void {
  const c = state.combatants.find((c) => c.id === id);
  if (!c) return;
  const canEdit = isGM || c.ownerId === playerId;
  if (!canEdit) return;

  const current = c.stats.hpCurrent;
  const input = document.createElement("input");
  input.type = "number";
  input.value = String(current);
  input.className = "inline-edit-input";
  input.min = "0";
  input.max = String(c.stats.hpMax);

  const parent = el.parentElement!;
  const original = el;
  original.style.display = "none";
  parent.insertBefore(input, original);
  input.focus();
  input.select();

  const commit = () => {
    const val = parseInt(input.value);
    if (!isNaN(val) && val !== current) {
      const combatants = state.combatants.map((existing) =>
        existing.id === id
          ? { ...existing, stats: { ...existing.stats, hpCurrent: Math.max(0, Math.min(val, existing.stats.hpMax)) } }
          : existing,
      );
      saveState({ ...state, combatants });
    } else {
      input.remove();
      original.style.display = "";
    }
  };

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      input.remove();
      original.style.display = "";
    }
  });
}

function showInlineApEdit(el: HTMLElement, state: CombatState, id: string): void {
  if (!state.round) return;
  const current = state.round.apCurrent[id] ?? 0;

  const input = document.createElement("input");
  input.type = "number";
  input.value = String(current);
  input.className = "inline-edit-input";
  input.min = "0";

  const parent = el.parentElement!;
  const original = el;
  original.style.display = "none";
  parent.insertBefore(input, original);
  input.focus();
  input.select();

  const commit = () => {
    const val = parseInt(input.value);
    if (!isNaN(val) && val !== current && val >= 0) {
      saveState({
        ...state,
        round: {
          ...state.round!,
          apCurrent: { ...state.round!.apCurrent, [id]: val },
        },
      });
    } else {
      input.remove();
      original.style.display = "";
    }
  };

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      input.remove();
      original.style.display = "";
    }
  });
}
