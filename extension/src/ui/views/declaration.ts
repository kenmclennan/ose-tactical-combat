import type { CombatState, Combatant, Declaration, ActionId } from "../../types";
import { saveState } from "../../state/store";
import {
  getActiveCombatants,
  getCurrentAp,
  getDeclaration,
  allDeclarationsLocked,
} from "../../state/selectors";
import { ACTION_LIST, ACTIONS } from "../../rules/actions";
import { buildResolutionOrder } from "../../rules/resolution";
import { renderCombatantCard, type CardOptions } from "../components/combatant-card";

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

  const cardOpts: CardOptions = {
    showAp: true,
    showEdit: true,
    showStatusToggle: true,
    isGM,
    isOwner,
    playerId,
  };

  if (c.status !== "active") {
    return `
      <div class="decl-row combatant-out">
        ${renderCombatantCard(c, state, cardOpts)}
      </div>
    `;
  }

  if (ap < 1) {
    return `
      <div class="decl-row">
        ${renderCombatantCard(c, state, cardOpts)}
        <div class="decl-status"><span class="stat muted">No AP remaining</span></div>
      </div>
    `;
  }

  // If this user can declare for this combatant, show the action picker
  if (canDeclare && !decl?.locked) {
    return `
      <div class="decl-row decl-active" data-combatant-id="${c.id}">
        ${renderCombatantCard(c, state, cardOpts)}
        <div class="action-picker">
          ${renderActionPicker(c.id, ap, decl)}
        </div>
        <div class="decl-controls">
          <button class="btn btn-sm btn-done" data-action="declare-done" data-combatant-id="${c.id}">
            Done - Bank AP as Fury
          </button>
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
    const isDone = decl.actionId === "done";
    const actionName = isDone
      ? "Done"
      : showAction
        ? ACTION_LIST.find((a) => a.id === decl.actionId)?.name ?? decl.actionId
        : null;
    return `
      <div class="decl-row decl-locked ${isDone ? "decl-done" : ""}">
        ${renderCombatantCard(c, state, cardOpts)}
        <div class="decl-status">
          ${showAction
            ? `<span class="decl-action-label">${actionName}${isDone ? "" : ` (${decl.cost} AP)`}</span>`
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
      ${renderCombatantCard(c, state, cardOpts)}
      <div class="decl-status"><span class="stat muted">Declaring...</span></div>
    </div>
  `;
}

function renderActionPicker(
  combatantId: string,
  ap: number,
  currentDecl: Declaration | undefined,
): string {
  // Filter out "done" from the action list - it has its own button
  const actions = ACTION_LIST.filter((a) => a.id !== "done");
  return `
    <div class="action-list">
      ${actions.map((a) => {
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
      case "declare-done": {
        const combatantId = target.dataset.combatantId;
        if (combatantId) {
          declareDone(state, combatantId, playerId, isGM);
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

function declareDone(
  state: CombatState,
  combatantId: string,
  playerId: string,
  isGM: boolean,
): void {
  const c = state.combatants.find((c) => c.id === combatantId);
  if (!c) return;

  const canDeclare = isGM ? c.side === "monster" : c.ownerId === playerId;
  if (!canDeclare) return;

  const cycle = state.round!.currentCycle;
  const existing = cycle.declarations.filter((d) => d.combatantId !== combatantId);
  const doneDecl: Declaration = {
    combatantId,
    actionId: "done",
    cost: 0,
    locked: true,
  };

  saveState({
    ...state,
    round: {
      ...state.round!,
      currentCycle: {
        ...cycle,
        declarations: [...existing, doneDecl],
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
  const cycle = state.round!.currentCycle;
  const declarations = [...cycle.declarations];

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
