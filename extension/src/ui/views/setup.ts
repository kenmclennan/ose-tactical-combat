import type { CombatState, Combatant, CombatantSide, DexCategory } from "../../types";
import type { PartyPlayer } from "../renderer";
import { PLAYER_BASE_AP, MONSTER_BASE_AP } from "../../util/constants";
import { generateId } from "../../util/ids";
import { getNextCopyName } from "../../util/names";
import { saveState, getState } from "../../state/store";
import { getPlayerCombatants, getMonsterCombatants } from "../../state/selectors";
import { computeStartingAp } from "../../rules/ap";
import { rollD6 } from "../../dice/roller";
import { showModal, closeModal } from "../modal";
import { renderCombatantCard, type CardOptions } from "../components/combatant-card";

export function renderSetupView(
  state: CombatState,
  playerId: string,
  isGM: boolean,
  _partyPlayers: PartyPlayer[] = [],
): string {
  const players = getPlayerCombatants(state);
  const monsters = getMonsterCombatants(state);
  const canStart =
    players.some((c) => c.status === "active") && monsters.some((c) => c.status === "active");

  return `
    <div class="setup-view">
      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Players</span>
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="player">+ Add</button>` : ""}
        </div>
        <div class="combatant-list">
          ${players.length === 0 ? `<div class="empty-list">No players added</div>` : ""}
          ${players.map((c) => renderSetupCard(c, state, playerId, isGM, _partyPlayers)).join("")}
        </div>
      </div>

      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Monsters</span>
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="monster">+ Add</button>` : ""}
        </div>
        <div class="combatant-list">
          ${monsters.length === 0 ? `<div class="empty-list">No monsters added</div>` : ""}
          ${monsters.map((c) => renderSetupCard(c, state, playerId, isGM, _partyPlayers)).join("")}
        </div>
      </div>

      ${
        isGM
          ? `
        <div class="setup-actions">
          <div class="setup-buttons">
            <button class="btn btn-secondary" data-action="cancel-setup">Cancel</button>
            <button class="btn btn-primary" data-action="start-combat" ${canStart ? "" : "disabled"}>
              Start Combat
            </button>
          </div>
          ${!canStart ? `<div class="hint">Need at least 1 player and 1 monster</div>` : ""}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderSetupCard(
  c: Combatant,
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: PartyPlayer[] = [],
): string {
  const isOwner = c.ownerId === playerId;
  const showStats = isGM || c.side === "player";
  const ownerName =
    c.side === "monster" ? "GM" : partyPlayers.find((p) => p.id === c.ownerId)?.name;

  const dexLabels: Record<DexCategory, string> = {
    penalty: "DEX-",
    standard: "DEX",
    bonus: "DEX+",
  };

  const extraStats = showStats
    ? `<span class="stat stat-ap">${c.apBase} AP${c.apVariance ? " ±" : ""} ${dexLabels[c.dexCategory]}</span>`
    : "";

  const copyButton =
    isGM && c.side === "monster"
      ? `<button class="btn-icon" data-action="copy-combatant" data-id="${c.id}" title="Copy">&#x2398;</button>`
      : "";

  const extraActions = [
    copyButton,
    c.surprised ? `<span class="badge badge-warning">Surprised</span>` : "",
    c.tokenId ? `<span class="badge badge-info">Token</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  const cardOpts: CardOptions = {
    showAp: false,
    showEdit: true,
    showStatusToggle: false,
    showRemove: true,
    isGM,
    isOwner,
    playerId,
    ownerName,
    extraStats,
    extraActions,
  };

  return `
    <div class="decl-row ${c.surprised ? "surprised" : ""}">
      ${renderCombatantCard(c, state, cardOpts)}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderOwnerDropdown(partyPlayers: PartyPlayer[], currentOwnerId?: string): string {
  const options = partyPlayers
    .map(
      (p) =>
        `<option value="${escapeHtml(p.id)}" ${p.id === currentOwnerId ? "selected" : ""}>${escapeHtml(p.name)}</option>`,
    )
    .join("");

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

export function renderEditModal(
  c: Combatant,
  isGM: boolean,
  partyPlayers: PartyPlayer[] = [],
  playerId?: string,
): string {
  const showOwnerDropdown = isGM && c.side === "player";
  const isOwner = playerId ? c.ownerId === playerId : false;
  const canEditName = isGM || isOwner;

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
            <input type="text" id="edit-name" value="${escapeHtml(c.name)}" ${canEditName ? "" : "disabled"} />
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
          ${
            isGM
              ? `
            <div class="form-row-group">
              <div class="form-row">
                <label>Base AP</label>
                <input type="number" id="edit-ap-base" value="${c.apBase}" min="1" max="12" />
              </div>
              <div class="form-row">
                <label class="checkbox-label">
                  <input type="checkbox" id="edit-ap-variance" ${c.apVariance ? "checked" : ""} />
                  Roll for AP
                </label>
              </div>
            </div>
          `
              : ""
          }
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

export function renderAddModal(
  side: CombatantSide,
  isGM: boolean,
  partyPlayers: PartyPlayer[] = [],
): string {
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
                Roll for AP
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
      case "copy-combatant":
        if (id && isGM) copyCombatant(state, id);
        break;
      case "remove-combatant":
        // Handled by global handler in renderer.ts (with confirmation)
        break;
      case "start-combat":
        if (isGM) startCombat(state, playerId);
        break;
    }
  });
}

export function showAddModalHandler(
  state: CombatState,
  side: CombatantSide,
  playerId: string,
  isGM: boolean,
  partyPlayers: PartyPlayer[],
  midCombat: boolean = false,
): void {
  showModal(renderAddModal(side, isGM, partyPlayers), (action, _data) => {
    if (action === "create-combatant") {
      const combatantId = createCombatantFromModal(state, side, playerId);
      closeModal();
      // If mid-combat, show AP assignment modal
      if (midCombat && combatantId) {
        const freshState = getState();
        if (freshState) {
          showApAssignModal(freshState, combatantId);
        }
      }
    }
  });
}

function showApAssignModal(state: CombatState, combatantId: string): void {
  const c = state.combatants.find((c) => c.id === combatantId);
  if (!c) return;
  const name = c.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  showModal(
    `
    <div class="modal-overlay" data-modal-overlay="true">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Set AP for ${name}</span>
          <button class="btn-icon" data-action="close-modal">&#x2715;</button>
        </div>
        <div class="modal-body">
          <div class="ap-roll-controls" style="justify-content: center; gap: 8px;">
            <button class="btn btn-sm btn-primary" data-action="roll-new-ap">Roll</button>
            <div class="manual-ap-input">
              <input type="number" class="input-sm" id="new-combatant-ap" min="1" max="12" placeholder="AP" />
              <button class="btn btn-sm btn-secondary" data-action="set-new-ap">Set</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    (action) => {
      const freshState = getState();
      if (!freshState?.round) return;
      const combatant = freshState.combatants.find((c) => c.id === combatantId);
      if (!combatant) return;

      if (action === "roll-new-ap") {
        const roll = rollD6();
        const ap = computeStartingAp(
          combatant.apBase,
          roll,
          combatant.dexCategory,
          combatant.apVariance,
          combatant.surprised,
        );
        saveState({
          ...freshState,
          round: {
            ...freshState.round!,
            apRolls: { ...freshState.round!.apRolls, [combatantId]: roll },
            apCurrent: { ...freshState.round!.apCurrent, [combatantId]: ap },
          },
        });
        closeModal();
      }

      if (action === "set-new-ap") {
        const input = document.querySelector("#new-combatant-ap") as HTMLInputElement | null;
        if (!input) return;
        const val = parseInt(input.value);
        if (isNaN(val) || val < 1) return;
        saveState({
          ...freshState,
          round: {
            ...freshState.round!,
            apRolls: { ...freshState.round!.apRolls, [combatantId]: 0 },
            apCurrent: { ...freshState.round!.apCurrent, [combatantId]: val },
          },
        });
        closeModal();
      }
    },
  );
}

export function showEditModalHandler(
  state: CombatState,
  id: string,
  isGM: boolean,
  playerId: string,
  partyPlayers: PartyPlayer[],
): void {
  const c = state.combatants.find((c) => c.id === id);
  if (!c) return;
  showModal(renderEditModal(c, isGM, partyPlayers, playerId), (action, _data) => {
    if (action === "save-combatant") {
      saveCombatantFromModal(state, id, isGM, playerId);
      closeModal();
    }
  });
}

function createCombatantFromModal(
  state: CombatState,
  side: CombatantSide,
  playerId: string,
): string {
  const name =
    (document.querySelector("#edit-name") as HTMLInputElement)?.value?.trim() || "Unknown";
  const hpMax = parseInt((document.querySelector("#edit-hp-max") as HTMLInputElement)?.value) || 8;
  const ac = parseInt((document.querySelector("#edit-ac") as HTMLInputElement)?.value) || 9;
  const thac0 = parseInt((document.querySelector("#edit-thac0") as HTMLInputElement)?.value) || 19;
  const dex =
    ((document.querySelector("#edit-dex") as HTMLSelectElement)?.value as DexCategory) ||
    "standard";
  const apBase =
    parseInt((document.querySelector("#edit-ap-base") as HTMLInputElement)?.value) ||
    (side === "monster" ? MONSTER_BASE_AP : PLAYER_BASE_AP);
  const apVariance =
    (document.querySelector("#edit-ap-variance") as HTMLInputElement)?.checked ?? side === "player";

  const ownerSelect = document.querySelector("#edit-owner") as HTMLSelectElement | null;
  const ownerId = side === "player" ? ownerSelect?.value || playerId : undefined;

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
  return combatant.id;
}

export function saveCombatantFromModal(
  state: CombatState,
  id: string,
  isGM: boolean,
  playerId?: string,
): void {
  const c = state.combatants.find((c) => c.id === id);
  if (!c) return;

  const name = (document.querySelector("#edit-name") as HTMLInputElement)?.value?.trim() || c.name;
  const hpCurrent =
    parseInt((document.querySelector("#edit-hp") as HTMLInputElement)?.value) ?? c.stats.hpCurrent;
  const hpMax =
    parseInt((document.querySelector("#edit-hp-max") as HTMLInputElement)?.value) || c.stats.hpMax;
  const ac =
    parseInt((document.querySelector("#edit-ac") as HTMLInputElement)?.value) ?? c.stats.ac;
  const thac0 =
    parseInt((document.querySelector("#edit-thac0") as HTMLInputElement)?.value) || c.stats.thac0;
  const dex =
    ((document.querySelector("#edit-dex") as HTMLSelectElement)?.value as DexCategory) ||
    c.dexCategory;

  const isOwner = playerId ? c.ownerId === playerId : false;
  const canEditName = isGM || isOwner;
  const updated: Combatant = {
    ...c,
    name: canEditName ? name : c.name,
    stats: { hpCurrent, hpMax, ac, thac0 },
    dexCategory: dex,
  };

  if (isGM) {
    const apBase =
      parseInt((document.querySelector("#edit-ap-base") as HTMLInputElement)?.value) || c.apBase;
    const apVariance =
      (document.querySelector("#edit-ap-variance") as HTMLInputElement)?.checked ?? c.apVariance;
    updated.apBase = apBase;
    updated.apVariance = apVariance;

    const ownerSelect = document.querySelector("#edit-owner") as HTMLSelectElement | null;
    if (ownerSelect) {
      updated.ownerId = ownerSelect.value || undefined;
    }
  }

  const newState: CombatState = {
    ...state,
    combatants: state.combatants.map((existing) => (existing.id === id ? updated : existing)),
  };
  saveState(newState);
}

function copyCombatant(state: CombatState, id: string): void {
  const source = state.combatants.find((c) => c.id === id);
  if (!source) return;

  const existingNames = state.combatants.map((c) => c.name);
  const newName = getNextCopyName(source.name, existingNames);

  const copy: Combatant = {
    id: generateId(),
    name: newName,
    side: source.side,
    status: source.status,
    stats: { ...source.stats, hpCurrent: source.stats.hpMax },
    dexCategory: source.dexCategory,
    apBase: source.apBase,
    apVariance: source.apVariance,
    surprised: source.surprised,
    ownerId: source.ownerId,
  };

  saveState({
    ...state,
    combatants: [...state.combatants, copy],
  });
}

function _removeCombatant(state: CombatState, id: string): void {
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
      movesUsed: {},
      currentCycle: {
        cycleNumber: 1,
        declarations: [],
        resolutionOrder: [],
        currentResolutionIndex: 0,
        waitingCombatants: [],
      },
      completedCycles: 0,
      doneForRound: [],
    },
  };
  saveState(updated);
}
