import type { CombatState, Combatant, CombatantSide } from "../../types";
import { saveState } from "../../state/store";
import { getActiveCombatants } from "../../state/selectors";
import { computeStartingAp } from "../../rules/ap";
import { rollD6 } from "../../dice/roller";
import { renderCombatantCard, type CardOptions } from "../components/combatant-card";

export function renderRoundStartView(
  state: CombatState,
  playerId: string,
  isGM: boolean,
): string {
  const active = getActiveCombatants(state);
  const round = state.round!;
  const allRolled = active.every((c) => round.apRolls[c.id] !== undefined);

  const players = active.filter((c) => c.side === "player");
  const monsters = active.filter((c) => c.side === "monster");
  const unrolledMonsters = monsters.filter((c) => round.apRolls[c.id] === undefined && c.status === "active");

  const isRound1 = round.roundNumber === 1;
  const playersSurprised = players.length > 0 && players.every((c) => c.surprised);
  const monstersSurprised = monsters.length > 0 && monsters.every((c) => c.surprised);

  return `
    <div class="round-start-view">
      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Players</span>
          ${isGM && isRound1 ? `<button class="btn btn-sm ${playersSurprised ? "btn-warning" : "btn-secondary"}" data-action="toggle-side-surprise" data-side="player">${playersSurprised ? "Surprised" : "Surprise"}</button>` : ""}
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="player">+ Add</button>` : ""}
        </div>
        ${players.map((c) => renderApRow(c, state, playerId, isGM)).join("")}
      </div>

      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Monsters</span>
          ${isGM && isRound1 ? `<button class="btn btn-sm ${monstersSurprised ? "btn-warning" : "btn-secondary"}" data-action="toggle-side-surprise" data-side="monster">${monstersSurprised ? "Surprised" : "Surprise"}</button>` : ""}
          ${isGM && unrolledMonsters.length > 0 ? `<button class="btn btn-sm btn-primary" data-action="roll-monster-ap">Roll All (${unrolledMonsters.length})</button>` : ""}
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="monster">+ Add</button>` : ""}
        </div>
        ${monsters.map((c) => renderApRow(c, state, playerId, isGM)).join("")}
      </div>

      ${isGM ? `
        <div class="round-actions">
          <button class="btn btn-primary btn-full" data-action="begin-declaration" ${allRolled ? "" : "disabled"}>
            Begin Declaration
          </button>
          ${!allRolled ? `<div class="hint">All combatants need AP assigned</div>` : ""}
        </div>
      ` : `
        <div class="hint">${allRolled ? "Waiting for GM to begin declaration..." : "Waiting for AP rolls..."}</div>
      `}
    </div>
  `;
}

function renderApRow(c: Combatant, state: CombatState, playerId: string, isGM: boolean): string {
  const round = state.round!;
  const roll = round.apRolls[c.id];
  const ap = round.apCurrent[c.id];
  const hasRoll = roll !== undefined;
  const isOwner = c.ownerId === playerId;
  const canRoll = isGM || (isOwner && c.side === "player");

  const cardOpts: CardOptions = {
    showAp: false,
    showEdit: true,
    showStatusToggle: true,
    isGM,
    isOwner,
    playerId,
  };

  // Out of action - card handles styling and "Out" badge, no AP controls needed
  if (c.status !== "active") {
    return `
      <div class="decl-row">
        ${renderCombatantCard(c, state, cardOpts)}
      </div>
    `;
  }

  // Surprised - show AP in stats, surprised badge in header
  if (c.surprised) {
    return `
      <div class="decl-row">
        ${renderCombatantCard(c, state, {
          ...cardOpts,
          showAp: true,
          extraActions: `<span class="badge badge-warning">Surprised</span>`,
        })}
      </div>
    `;
  }

  // Already rolled - show AP in stats, die result in stats row, edit in header
  if (hasRoll) {
    return `
      <div class="decl-row">
        ${renderCombatantCard(c, state, {
          ...cardOpts,
          showAp: true,
          dieResult: roll,
          extraActions: isGM ? `<button class="btn-icon" data-action="edit-rolled-ap" data-id="${c.id}" title="Edit AP">&#x270E;</button>` : "",
        })}
      </div>
    `;
  }

  // Not yet rolled - Roll button + manual input in header
  return `
    <div class="decl-row">
      ${renderCombatantCard(c, state, {
        ...cardOpts,
        extraActions: canRoll ? `
          <button class="btn btn-sm btn-primary" data-action="roll-single-ap" data-id="${c.id}">Roll</button>
          <div class="manual-ap-input">
            <input type="number" class="input-sm" data-manual-ap="${c.id}" min="1" max="12" placeholder="AP" />
            <button class="btn btn-sm btn-secondary" data-action="set-manual-ap" data-id="${c.id}">Set</button>
          </div>
        ` : `<span class="ap-value pending">--</span>`,
      })}
    </div>
  `;
}

export function bindRoundStartEvents(
  container: HTMLElement,
  state: CombatState,
  playerId: string,
  isGM: boolean,
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;

    switch (action) {
      case "roll-single-ap":
        if (id) rollSingleAp(state, id, playerId, isGM);
        break;
      case "set-manual-ap":
        if (id) setManualAp(state, id, container, playerId, isGM);
        break;
      case "roll-monster-ap":
        if (isGM) rollMonsterAp(state);
        break;
      case "edit-rolled-ap":
        if (id && isGM) showApEditInline(target, state, id);
        break;
      case "toggle-side-surprise":
        if (isGM) toggleSideSurprise(state, target.dataset.side as CombatantSide);
        break;
      case "begin-declaration":
        if (isGM) beginDeclaration(state);
        break;
    }
  });
}

function rollSingleAp(state: CombatState, combatantId: string, playerId: string, isGM: boolean): void {
  const c = state.combatants.find((c) => c.id === combatantId);
  if (!c || c.status !== "active") return;

  const canRoll = isGM || (c.ownerId === playerId && c.side === "player");
  if (!canRoll) return;

  const round = state.round!;
  if (round.apRolls[combatantId] !== undefined) return;

  const roll = rollD6();
  const ap = computeStartingAp(c.apBase, roll, c.dexCategory, c.apVariance, c.surprised);

  saveState({
    ...state,
    round: {
      ...round,
      apRolls: { ...round.apRolls, [combatantId]: roll },
      apCurrent: { ...round.apCurrent, [combatantId]: ap },
    },
  });
}

function setManualAp(state: CombatState, combatantId: string, container: HTMLElement, playerId: string, isGM: boolean): void {
  const c = state.combatants.find((c) => c.id === combatantId);
  if (!c || c.status !== "active") return;

  const canSet = isGM || (c.ownerId === playerId && c.side === "player");
  if (!canSet) return;

  const input = container.querySelector(`[data-manual-ap="${combatantId}"]`) as HTMLInputElement | null;
  if (!input) return;

  const val = parseInt(input.value);
  if (isNaN(val) || val < 1) return;

  const round = state.round!;
  saveState({
    ...state,
    round: {
      ...round,
      apRolls: { ...round.apRolls, [combatantId]: 0 },
      apCurrent: { ...round.apCurrent, [combatantId]: val },
    },
  });
}

function rollMonsterAp(state: CombatState): void {
  const active = getActiveCombatants(state);
  const round = state.round!;
  const apRolls = { ...round.apRolls };
  const apCurrent = { ...round.apCurrent };

  for (const c of active) {
    if (c.side !== "monster" || c.status !== "active") continue;
    if (apRolls[c.id] !== undefined) continue;

    const roll = rollD6();
    apRolls[c.id] = roll;
    apCurrent[c.id] = computeStartingAp(c.apBase, roll, c.dexCategory, c.apVariance, c.surprised);
  }

  saveState({
    ...state,
    round: { ...round, apRolls, apCurrent },
  });
}

function showApEditInline(el: HTMLElement, state: CombatState, id: string): void {
  if (!state.round) return;
  const current = state.round.apCurrent[id] ?? 0;

  const input = document.createElement("input");
  input.type = "number";
  input.value = String(current);
  input.className = "inline-edit-input";
  input.min = "0";

  const parent = el.parentElement!;
  el.style.display = "none";
  parent.insertBefore(input, el);
  input.focus();
  input.select();

  const commit = () => {
    const val = parseInt(input.value);
    if (!isNaN(val) && val >= 0 && val !== current) {
      saveState({
        ...state,
        round: {
          ...state.round!,
          apCurrent: { ...state.round!.apCurrent, [id]: val },
        },
      });
    } else {
      input.remove();
      el.style.display = "";
    }
  };

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      input.remove();
      el.style.display = "";
    }
  });
}

function toggleSideSurprise(state: CombatState, side: CombatantSide): void {
  const active = getActiveCombatants(state);
  const sideCombatants = active.filter((c) => c.side === side && c.status === "active");
  const allSurprised = sideCombatants.every((c) => c.surprised);
  const newSurprised = !allSurprised;

  const combatants = state.combatants.map((c) => {
    if (c.side !== side || c.status !== "active") return c;
    return { ...c, surprised: newSurprised };
  });

  // Recalculate AP - surprised AP ignores the roll, so we can auto-set it
  const round = state.round!;
  const apRolls = { ...round.apRolls };
  const apCurrent = { ...round.apCurrent };
  for (const c of combatants) {
    if (c.side !== side || c.status !== "active") continue;
    if (newSurprised) {
      // Auto-set AP for all (surprised ignores roll)
      apCurrent[c.id] = computeStartingAp(c.apBase, 0, c.dexCategory, c.apVariance, true);
      if (apRolls[c.id] === undefined) apRolls[c.id] = 0;
    } else {
      // Un-surprise: recalculate if they have a real roll, clear if auto-rolled
      if (apRolls[c.id] === 0) {
        delete apRolls[c.id];
        delete apCurrent[c.id];
      } else if (apRolls[c.id] !== undefined) {
        apCurrent[c.id] = computeStartingAp(c.apBase, apRolls[c.id], c.dexCategory, c.apVariance, false);
      }
    }
  }

  saveState({
    ...state,
    combatants,
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
