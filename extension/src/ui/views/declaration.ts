import type { CombatState, Combatant, Declaration, ActionId } from "../../types";
import { saveState } from "../../state/store";
import {
  getActiveCombatants,
  getCurrentAp,
  getDeclaration,
  allDeclarationsLocked,
} from "../../state/selectors";
import { ACTION_LIST } from "../../rules/actions";
import { buildResolutionOrder } from "../../rules/resolution";

export function renderDeclarationView(
  state: CombatState,
  playerId: string,
  isGM: boolean,
): string {
  const active = getActiveCombatants(state);
  const allLocked = allDeclarationsLocked(state);

  const playerChars = active.filter((c) => c.side === "player");
  const monsters = active.filter((c) => c.side === "monster");

  return `
    <div class="declaration-view">
      <div class="combatant-section">
        <div class="section-title">Players</div>
        ${playerChars.map((c) => renderDeclarationRow(c, state, playerId, isGM)).join("")}
      </div>
      <div class="combatant-section">
        <div class="section-title">Monsters</div>
        ${monsters.map((c) => renderDeclarationRow(c, state, playerId, isGM)).join("")}
      </div>
      ${isGM ? `
        <div class="declaration-actions">
          <button class="btn btn-primary btn-full" data-action="advance-resolution" ${allLocked ? "" : "disabled"}>
            Resolve Actions
          </button>
          ${!allLocked ? `<div class="hint">Waiting for all declarations to lock in</div>` : ""}
          <button class="btn btn-sm btn-secondary btn-full" data-action="force-resolve">Force Resolve (skip unlocked)</button>
        </div>
      ` : ""}
    </div>
  `;
}

function renderDeclarationRow(
  c: Combatant,
  state: CombatState,
  playerId: string,
  isGM: boolean,
): string {
  const ap = getCurrentAp(state, c.id);
  const decl = getDeclaration(state, c.id);
  const isOwner = c.ownerId === playerId;
  const canDeclare = isGM ? c.side === "monster" : isOwner;
  const statusClass = c.status !== "active" ? "combatant-dead" : "";

  if (c.status !== "active") {
    return `
      <div class="decl-row ${statusClass}">
        <div class="decl-info">
          <span class="combatant-name">${escapeHtml(c.name)}</span>
          <span class="stat muted">Out</span>
        </div>
      </div>
    `;
  }

  if (ap < 1) {
    return `
      <div class="decl-row">
        <div class="decl-info">
          <span class="combatant-name">${escapeHtml(c.name)}</span>
          <span class="ap-display">0 AP</span>
          <span class="stat muted">No AP remaining</span>
        </div>
      </div>
    `;
  }

  // If this user can declare for this combatant, show the action picker
  if (canDeclare && !decl?.locked) {
    return `
      <div class="decl-row decl-active" data-combatant-id="${c.id}">
        <div class="decl-info">
          <span class="combatant-name">${escapeHtml(c.name)}</span>
          <span class="ap-display">${ap} AP</span>
        </div>
        <div class="action-picker">
          ${renderActionPicker(c.id, ap, decl)}
        </div>
        <div class="decl-controls">
          <button class="btn btn-primary btn-sm" data-action="lock-declaration" data-combatant-id="${c.id}" ${decl ? "" : "disabled"}>
            Lock In
          </button>
        </div>
      </div>
    `;
  }

  // Locked declaration - show differently based on role and secrecy
  if (decl?.locked) {
    const showAction = isGM || isOwner;
    const actionName = showAction
      ? ACTION_LIST.find((a) => a.id === decl.actionId)?.name ?? decl.actionId
      : null;
    return `
      <div class="decl-row decl-locked">
        <div class="decl-info">
          <span class="combatant-name">${escapeHtml(c.name)}</span>
          <span class="ap-display">${ap} AP</span>
          ${showAction
            ? `<span class="decl-action-label">${actionName} (${decl.cost} AP)</span>`
            : `<span class="badge badge-info">Locked</span>`
          }
        </div>
        ${isGM ? `
          <button class="btn-icon" data-action="unlock-declaration" data-combatant-id="${c.id}" title="Unlock">&#x1F513;</button>
        ` : ""}
      </div>
    `;
  }

  // Someone else's unlocked combatant - show "declaring..."
  return `
    <div class="decl-row">
      <div class="decl-info">
        <span class="combatant-name">${escapeHtml(c.name)}</span>
        <span class="ap-display">${ap} AP</span>
        <span class="stat muted">Declaring...</span>
      </div>
    </div>
  `;
}

function renderActionPicker(
  combatantId: string,
  ap: number,
  currentDecl: Declaration | undefined,
): string {
  return `
    <div class="action-list">
      ${ACTION_LIST.map((a) => {
        const affordable = a.cost <= ap;
        const selected = currentDecl?.actionId === a.id;
        return `
          <button
            class="action-btn ${selected ? "selected" : ""} ${affordable ? "" : "unaffordable"}"
            data-action="select-action"
            data-combatant-id="${combatantId}"
            data-action-id="${a.id}"
            data-cost="${a.cost}"
            ${affordable ? "" : "disabled"}
            title="${a.description}"
          >
            <span class="action-cost">${a.cost}</span>
            <span class="action-name">${a.name}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function bindDeclarationEvents(
  container: HTMLElement,
  state: CombatState,
  playerId: string,
  isGM: boolean,
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;

    switch (action) {
      case "select-action": {
        const combatantId = target.dataset.combatantId;
        const actionId = target.dataset.actionId as ActionId;
        const cost = parseInt(target.dataset.cost || "0");
        if (combatantId && actionId) {
          selectAction(state, combatantId, actionId, cost, playerId, isGM);
        }
        break;
      }
      case "lock-declaration": {
        const combatantId = target.dataset.combatantId;
        if (combatantId) {
          lockDeclaration(state, combatantId);
        }
        break;
      }
      case "unlock-declaration": {
        const combatantId = target.dataset.combatantId;
        if (combatantId && isGM) {
          unlockDeclaration(state, combatantId);
        }
        break;
      }
      case "advance-resolution":
        if (isGM) advanceToResolution(state);
        break;
      case "force-resolve":
        if (isGM) forceResolve(state);
        break;
    }
  });
}

function selectAction(
  state: CombatState,
  combatantId: string,
  actionId: ActionId,
  cost: number,
  playerId: string,
  isGM: boolean,
): void {
  const c = state.combatants.find((c) => c.id === combatantId);
  if (!c) return;

  // Permission check
  const canDeclare = isGM ? c.side === "monster" : c.ownerId === playerId;
  if (!canDeclare) return;

  const cycle = state.round!.currentCycle;
  const existing = cycle.declarations.filter((d) => d.combatantId !== combatantId);
  const newDecl: Declaration = {
    combatantId,
    actionId,
    cost,
    locked: false,
  };

  saveState({
    ...state,
    round: {
      ...state.round!,
      currentCycle: {
        ...cycle,
        declarations: [...existing, newDecl],
      },
    },
  });
}

function lockDeclaration(state: CombatState, combatantId: string): void {
  const cycle = state.round!.currentCycle;
  const declarations = cycle.declarations.map((d) =>
    d.combatantId === combatantId ? { ...d, locked: true } : d,
  );

  saveState({
    ...state,
    round: {
      ...state.round!,
      currentCycle: { ...cycle, declarations },
    },
  });
}

function unlockDeclaration(state: CombatState, combatantId: string): void {
  const cycle = state.round!.currentCycle;
  const declarations = cycle.declarations.map((d) =>
    d.combatantId === combatantId ? { ...d, locked: false } : d,
  );

  saveState({
    ...state,
    round: {
      ...state.round!,
      currentCycle: { ...cycle, declarations },
    },
  });
}

function advanceToResolution(state: CombatState): void {
  const order = buildResolutionOrder(state);
  saveState({
    ...state,
    phase: "resolution",
    round: {
      ...state.round!,
      currentCycle: {
        ...state.round!.currentCycle,
        resolutionOrder: order,
        currentResolutionIndex: 0,
      },
    },
  });
}

function forceResolve(state: CombatState): void {
  // Lock all unlocked declarations for combatants that have AP but haven't declared
  const cycle = state.round!.currentCycle;
  const active = getActiveCombatants(state);
  const declarations = [...cycle.declarations];

  // Only include locked declarations in resolution
  const order = buildResolutionOrder({
    ...state,
    round: {
      ...state.round!,
      currentCycle: { ...cycle, declarations },
    },
  });

  saveState({
    ...state,
    phase: "resolution",
    round: {
      ...state.round!,
      currentCycle: {
        ...cycle,
        declarations,
        resolutionOrder: order,
        currentResolutionIndex: 0,
      },
    },
  });
}
