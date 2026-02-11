import type { CombatState, Combatant, CombatantSide, DexCategory } from "../../types";
import type { PartyPlayer } from "../renderer";
import { PLAYER_BASE_AP, MONSTER_BASE_AP } from "../../util/constants";
import { generateId } from "../../util/ids";
import { saveState } from "../../state/store";
import { getPlayerCombatants, getMonsterCombatants } from "../../state/selectors";
import { showModal, closeModal } from "../modal";

export function renderSetupView(
  state: CombatState,
  playerId: string,
  isGM: boolean,
  _partyPlayers: PartyPlayer[] = [],
): string {
  const players = getPlayerCombatants(state);
  const monsters = getMonsterCombatants(state);
  const canStart = players.some((c) => c.status === "active") &&
    monsters.some((c) => c.status === "active");

  return `
    <div class="setup-view">
      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Players</span>
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="player">+ Add</button>` : ""}
        </div>
        <div class="combatant-list">
          ${players.length === 0 ? `<div class="empty-list">No players added</div>` : ""}
          ${players.map((c) => renderCombatantRow(c, playerId, isGM)).join("")}
        </div>
      </div>

      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Monsters</span>
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="monster">+ Add</button>` : ""}
        </div>
        <div class="combatant-list">
          ${monsters.length === 0 ? `<div class="empty-list">No monsters added</div>` : ""}
          ${monsters.map((c) => renderCombatantRow(c, playerId, isGM)).join("")}
        </div>
      </div>

      ${isGM ? `
        <div class="setup-actions">
          <button class="btn btn-primary btn-full" data-action="start-combat" ${canStart ? "" : "disabled"}>
            Start Combat
          </button>
          ${!canStart ? `<div class="hint">Need at least 1 player and 1 monster</div>` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

function renderCombatantRow(
  c: Combatant,
  playerId: string,
  isGM: boolean,
): string {
  const isOwner = c.ownerId === playerId;
  const canEdit = isGM || isOwner;
  const showStats = isGM || c.side === "player";

  return `
    <div class="combatant-row ${c.surprised ? "surprised" : ""}" data-id="${c.id}">
      <div class="combatant-header">
        <span class="combatant-name">${escapeHtml(c.name)}</span>
        <div class="combatant-badges">
          ${c.surprised ? `<span class="badge badge-warning">Surprised</span>` : ""}
          ${c.tokenId ? `<span class="badge badge-info">Token</span>` : ""}
          ${canEdit ? `<button class="btn-icon" data-action="edit-combatant" data-id="${c.id}" title="Edit">&#x270E;</button>` : ""}
          ${isGM ? `<button class="btn-icon btn-danger-icon" data-action="remove-combatant" data-id="${c.id}" title="Remove">&#x2715;</button>` : ""}
        </div>
      </div>
      ${showStats ? `
        <div class="combatant-stats">
          <span class="stat">HP ${c.stats.hpCurrent}/${c.stats.hpMax}</span>
          <span class="stat">AC ${c.stats.ac}</span>
          <span class="stat">THAC0 ${c.stats.thac0}</span>
          <span class="stat">AP ${c.apBase}${c.apVariance ? "±" : ""}</span>
          <span class="stat">${dexLabel(c.dexCategory)}</span>
        </div>
      ` : `
        <div class="combatant-stats">
          <span class="stat muted">${c.side === "monster" ? "Stats hidden" : ""}</span>
        </div>
      `}
    </div>
  `;
}

function dexLabel(cat: DexCategory): string {
  switch (cat) {
    case "penalty": return "DEX-";
    case "standard": return "DEX";
    case "bonus": return "DEX+";
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderOwnerDropdown(partyPlayers: PartyPlayer[], currentOwnerId?: string): string {
  const options = partyPlayers.map((p) =>
    `<option value="${escapeHtml(p.id)}" ${p.id === currentOwnerId ? "selected" : ""}>${escapeHtml(p.name)}</option>`
  ).join("");

  return `
    <div class="form-row">
      <label>Assign to Player</label>
      <select id="edit-owner">
        ${options}
      </select>
    </div>
  `;
}

// --- Edit modal ---

export function renderEditModal(c: Combatant, isGM: boolean, partyPlayers: PartyPlayer[] = []): string {
  const showOwnerDropdown = isGM && c.side === "player";

  return `
    <div class="modal-overlay" data-modal-overlay="true">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Edit ${escapeHtml(c.name)}</span>
          <button class="btn-icon" data-action="close-modal">&#x2715;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Name</label>
            <input type="text" id="edit-name" value="${escapeHtml(c.name)}" ${isGM ? "" : "disabled"} />
          </div>
          ${showOwnerDropdown ? renderOwnerDropdown(partyPlayers, c.ownerId) : ""}
          <div class="form-row-group">
            <div class="form-row">
              <label>HP</label>
              <div class="input-pair">
                <input type="number" id="edit-hp" value="${c.stats.hpCurrent}" min="0" />
                <span>/</span>
                <input type="number" id="edit-hp-max" value="${c.stats.hpMax}" min="1" />
              </div>
            </div>
            <div class="form-row">
              <label>AC</label>
              <input type="number" id="edit-ac" value="${c.stats.ac}" />
            </div>
          </div>
          <div class="form-row-group">
            <div class="form-row">
              <label>THAC0</label>
              <input type="number" id="edit-thac0" value="${c.stats.thac0}" min="1" max="20" />
            </div>
            <div class="form-row">
              <label>DEX Category</label>
              <select id="edit-dex">
                <option value="penalty" ${c.dexCategory === "penalty" ? "selected" : ""}>3-8 (Penalty)</option>
                <option value="standard" ${c.dexCategory === "standard" ? "selected" : ""}>9-12 (Standard)</option>
                <option value="bonus" ${c.dexCategory === "bonus" ? "selected" : ""}>13-18 (Bonus)</option>
              </select>
            </div>
          </div>
          ${isGM ? `
            <div class="form-row-group">
              <div class="form-row">
                <label>Base AP</label>
                <input type="number" id="edit-ap-base" value="${c.apBase}" min="1" max="12" />
              </div>
              <div class="form-row">
                <label class="checkbox-label">
                  <input type="checkbox" id="edit-ap-variance" ${c.apVariance ? "checked" : ""} />
                  Roll for variance
                </label>
              </div>
            </div>
            <div class="form-row">
              <label class="checkbox-label">
                <input type="checkbox" id="edit-surprised" ${c.surprised ? "checked" : ""} />
                Surprised (half AP, no variance)
              </label>
            </div>
          ` : ""}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" data-action="save-combatant" data-id="${c.id}">Save</button>
        </div>
      </div>
    </div>
  `;
}

// --- Add modal ---

export function renderAddModal(side: CombatantSide, isGM: boolean, partyPlayers: PartyPlayer[] = []): string {
  const isMonster = side === "monster";
  const defaultAp = isMonster ? MONSTER_BASE_AP : PLAYER_BASE_AP;
  const defaultName = isMonster ? "Monster" : "Character";
  const showOwnerDropdown = isGM && side === "player";

  return `
    <div class="modal-overlay" data-modal-overlay="true">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Add ${isMonster ? "Monster" : "Player"}</span>
          <button class="btn-icon" data-action="close-modal">&#x2715;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Name</label>
            <input type="text" id="edit-name" value="${defaultName}" />
          </div>
          ${showOwnerDropdown ? renderOwnerDropdown(partyPlayers) : ""}
          <div class="form-row-group">
            <div class="form-row">
              <label>HP Max</label>
              <input type="number" id="edit-hp-max" value="8" min="1" />
            </div>
            <div class="form-row">
              <label>AC</label>
              <input type="number" id="edit-ac" value="${isMonster ? 7 : 9}" />
            </div>
          </div>
          <div class="form-row-group">
            <div class="form-row">
              <label>THAC0</label>
              <input type="number" id="edit-thac0" value="${isMonster ? 17 : 19}" min="1" max="20" />
            </div>
            <div class="form-row">
              <label>DEX Category</label>
              <select id="edit-dex">
                <option value="penalty">3-8 (Penalty)</option>
                <option value="standard" selected>9-12 (Standard)</option>
                <option value="bonus">13-18 (Bonus)</option>
              </select>
            </div>
          </div>
          <div class="form-row-group">
            <div class="form-row">
              <label>Base AP</label>
              <input type="number" id="edit-ap-base" value="${defaultAp}" min="1" max="12" />
            </div>
            <div class="form-row">
              <label class="checkbox-label">
                <input type="checkbox" id="edit-ap-variance" ${isMonster ? "" : "checked"} />
                Roll for variance
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" data-action="create-combatant" data-side="${side}">Add</button>
        </div>
      </div>
    </div>
  `;
}

// --- Event handling ---

export function bindSetupEvents(
  container: HTMLElement,
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: PartyPlayer[] = [],
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    const side = target.dataset.side as CombatantSide | undefined;

    switch (action) {
      case "add-combatant":
        if (side) showAddModalHandler(state, side, playerId, isGM, partyPlayers);
        break;
      case "edit-combatant":
        if (id) showEditModalHandler(state, id, isGM, playerId, partyPlayers);
        break;
      case "remove-combatant":
        if (id && isGM) removeCombatant(state, id);
        break;
      case "start-combat":
        if (isGM) startCombat(state, playerId);
        break;
    }
  });
}

function showAddModalHandler(state: CombatState, side: CombatantSide, playerId: string, isGM: boolean, partyPlayers: PartyPlayer[]): void {
  showModal(renderAddModal(side, isGM, partyPlayers), (action, data) => {
    if (action === "create-combatant") {
      createCombatantFromModal(state, side, playerId);
      closeModal();
    }
  });
}

export function showEditModalHandler(state: CombatState, id: string, isGM: boolean, playerId: string, partyPlayers: PartyPlayer[]): void {
  const c = state.combatants.find((c) => c.id === id);
  if (!c) return;
  showModal(renderEditModal(c, isGM, partyPlayers), (action, data) => {
    if (action === "save-combatant") {
      saveCombatantFromModal(state, id, isGM);
      closeModal();
    }
  });
}

function createCombatantFromModal(
  state: CombatState,
  side: CombatantSide,
  playerId: string,
): void {
  const name = (document.querySelector("#edit-name") as HTMLInputElement)?.value?.trim() || "Unknown";
  const hpMax = parseInt((document.querySelector("#edit-hp-max") as HTMLInputElement)?.value) || 8;
  const ac = parseInt((document.querySelector("#edit-ac") as HTMLInputElement)?.value) || 9;
  const thac0 = parseInt((document.querySelector("#edit-thac0") as HTMLInputElement)?.value) || 19;
  const dex = (document.querySelector("#edit-dex") as HTMLSelectElement)?.value as DexCategory || "standard";
  const apBase = parseInt((document.querySelector("#edit-ap-base") as HTMLInputElement)?.value) || (side === "monster" ? MONSTER_BASE_AP : PLAYER_BASE_AP);
  const apVariance = (document.querySelector("#edit-ap-variance") as HTMLInputElement)?.checked ?? (side === "player");

  const ownerSelect = document.querySelector("#edit-owner") as HTMLSelectElement | null;
  const ownerId = side === "player"
    ? (ownerSelect?.value || playerId)
    : undefined;

  const combatant: Combatant = {
    id: generateId(),
    name,
    side,
    status: "active",
    stats: { hpCurrent: hpMax, hpMax, ac, thac0 },
    dexCategory: dex,
    apBase,
    apVariance,
    surprised: false,
    ownerId,
  };

  const updated: CombatState = {
    ...state,
    combatants: [...state.combatants, combatant],
  };
  saveState(updated);
}

export function saveCombatantFromModal(
  state: CombatState,
  id: string,
  isGM: boolean,
): void {
  const c = state.combatants.find((c) => c.id === id);
  if (!c) return;

  const name = (document.querySelector("#edit-name") as HTMLInputElement)?.value?.trim() || c.name;
  const hpCurrent = parseInt((document.querySelector("#edit-hp") as HTMLInputElement)?.value) ?? c.stats.hpCurrent;
  const hpMax = parseInt((document.querySelector("#edit-hp-max") as HTMLInputElement)?.value) || c.stats.hpMax;
  const ac = parseInt((document.querySelector("#edit-ac") as HTMLInputElement)?.value) ?? c.stats.ac;
  const thac0 = parseInt((document.querySelector("#edit-thac0") as HTMLInputElement)?.value) || c.stats.thac0;
  const dex = (document.querySelector("#edit-dex") as HTMLSelectElement)?.value as DexCategory || c.dexCategory;

  const updated: Combatant = {
    ...c,
    name: isGM ? name : c.name,
    stats: { hpCurrent, hpMax, ac, thac0 },
    dexCategory: dex,
  };

  if (isGM) {
    const apBase = parseInt((document.querySelector("#edit-ap-base") as HTMLInputElement)?.value) || c.apBase;
    const apVariance = (document.querySelector("#edit-ap-variance") as HTMLInputElement)?.checked ?? c.apVariance;
    const surprised = (document.querySelector("#edit-surprised") as HTMLInputElement)?.checked ?? c.surprised;
    updated.apBase = apBase;
    updated.apVariance = apVariance;
    updated.surprised = surprised;

    const ownerSelect = document.querySelector("#edit-owner") as HTMLSelectElement | null;
    if (ownerSelect) {
      updated.ownerId = ownerSelect.value || undefined;
    }
  }

  const newState: CombatState = {
    ...state,
    combatants: state.combatants.map((existing) =>
      existing.id === id ? updated : existing,
    ),
  };
  saveState(newState);
}

function removeCombatant(state: CombatState, id: string): void {
  const updated: CombatState = {
    ...state,
    combatants: state.combatants.filter((c) => c.id !== id),
  };
  saveState(updated);
}

function startCombat(state: CombatState, gmId: string): void {
  const updated: CombatState = {
    ...state,
    phase: "round-start",
    gmId,
    round: {
      roundNumber: 1,
      apRolls: {},
      apCurrent: {},
      currentCycle: {
        cycleNumber: 1,
        declarations: [],
        resolutionOrder: [],
        currentResolutionIndex: 0,
      },
      completedCycles: 0,
    },
  };
  saveState(updated);
}
