import type { CombatState, Combatant, Declaration, ActionId } from "../../types";
import { updateState } from "../../state/store";
import {
  getActiveCombatants,
  getCurrentAp,
  getDeclaration,
  allDeclarationsLocked,
  isDoneForRound,
  getRemainingMoves,
  canAffordWait,
} from "../../state/selectors";
import { ACTION_LIST, CATEGORY_ORDER, CATEGORY_LABELS } from "../../rules/actions";
import {
  buildResolutionOrder,
  deductCycleCosts,
  deductCycleMoveCosts,
} from "../../rules/resolution";
import { renderCombatantCard, type CardOptions } from "../components/combatant-card";

export function renderDeclarationView(
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: { id: string; name: string }[] = [],
): string {
  const active = getActiveCombatants(state);
  const allLocked = allDeclarationsLocked(state);

  const playerChars = active.filter((c) => c.side === "player");
  const monsters = active.filter((c) => c.side === "monster");

  return `
    <div class="declaration-view">
      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Players</span>
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="player">+ Add</button>` : ""}
        </div>
        ${playerChars.map((c) => renderDeclarationRow(c, state, playerId, isGM, partyPlayers)).join("")}
      </div>
      <div class="combatant-section">
        <div class="section-header">
          <span class="section-title">Monsters</span>
          ${isGM ? `<button class="btn btn-sm btn-accent" data-action="add-combatant" data-side="monster">+ Add</button>` : ""}
        </div>
        ${monsters.map((c) => renderDeclarationRow(c, state, playerId, isGM, partyPlayers)).join("")}
      </div>
      ${
        isGM
          ? `
        <div class="declaration-actions">
          <div class="round-actions-row">
            <button class="btn btn-secondary" data-action="end-combat">End Combat</button>
            <button class="btn btn-secondary" data-action="force-end-round">End Round</button>
            <button class="btn btn-primary" data-action="advance-resolution" ${allLocked ? "" : "disabled"}>Resolve Actions</button>
          </div>
          ${!allLocked ? `<div class="hint">Waiting for all declarations to lock in</div>` : ""}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderDeclarationRow(
  c: Combatant,
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: { id: string; name: string }[] = [],
): string {
  const ap = getCurrentAp(state, c.id);
  const decl = getDeclaration(state, c.id);
  const isOwner = c.ownerId === playerId;
  const canDeclare = (isGM && c.side === "monster") || isOwner;
  const ownerName =
    c.side === "monster" ? "GM" : partyPlayers.find((p) => p.id === c.ownerId)?.name;

  const cardOpts: CardOptions = {
    showAp: true,
    showEdit: true,
    showStatusToggle: true,
    showRemove: true,
    isGM,
    isOwner,
    playerId,
    ownerName,
  };

  if (c.status !== "active") {
    return `
      <div class="decl-row">
        ${renderCombatantCard(c, state, cardOpts)}
      </div>
    `;
  }

  // Done for the round - show with no action picker, GM can undo
  const doneForRound = isDoneForRound(state, c.id);
  if (doneForRound) {
    const doneStatus = `<span class="stat muted">Done for round</span>${isGM ? `<button class="btn-icon" data-action="undo-done-for-round" data-combatant-id="${c.id}" title="Undo done">&#x21A9;</button>` : ""}`;
    return `
      <div class="decl-row decl-done">
        ${renderCombatantCard(c, state, { ...cardOpts, statusContent: doneStatus })}
      </div>
    `;
  }

  if (ap < 1) {
    return `
      <div class="decl-row">
        ${renderCombatantCard(c, state, { ...cardOpts, statusContent: '<span class="stat muted">No AP remaining</span>' })}
      </div>
    `;
  }

  // If this user can declare for this combatant, show the action picker
  const doneButtonText = c.side === "monster" ? "Done - No more actions" : "Done - Bank AP as Fury";
  if (canDeclare && !decl?.locked) {
    return `
      <div class="decl-row decl-active ${!decl ? "decl-undeclared" : ""}" data-combatant-id="${c.id}">
        ${renderCombatantCard(c, state, cardOpts)}
        <div class="action-picker">
          ${renderActionPicker(state, c.id, ap, getRemainingMoves(state, c.id), decl)}
        </div>
        <div class="decl-controls">
          <button class="btn btn-sm btn-done" data-action="declare-done" data-combatant-id="${c.id}">
            ${doneButtonText}
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
        ? (ACTION_LIST.find((a) => a.id === decl.actionId)?.name ?? decl.actionId)
        : null;
    const lockedStatus = showAction
      ? `<span class="decl-action-label">${actionName}${isDone ? "" : ` (${decl.cost} AP)`}</span>`
      : `<span class="badge badge-info">Locked</span>`;
    const lockedCardOpts: CardOptions = {
      ...cardOpts,
      extraActions: isGM
        ? `<button class="btn-icon" data-action="unlock-declaration" data-combatant-id="${c.id}" title="Unlock">&#x1F513;</button>`
        : undefined,
      statusContent: lockedStatus,
    };
    return `
      <div class="decl-row decl-locked ${isDone ? "decl-done" : ""}">
        ${renderCombatantCard(c, state, lockedCardOpts)}
      </div>
    `;
  }

  // Someone else's unlocked combatant - show "declaring..."
  return `
    <div class="decl-row decl-undeclared">
      ${renderCombatantCard(c, state, { ...cardOpts, statusContent: '<span class="stat muted">Declaring...</span>' })}
    </div>
  `;
}

function renderActionPicker(
  state: CombatState,
  combatantId: string,
  ap: number,
  remainingMoves: number,
  currentDecl: Declaration | undefined,
): string {
  // Filter out "done" from the action list - it has its own button
  const actions = ACTION_LIST.filter((a) => a.id !== "done");

  const renderButton = (a: (typeof actions)[number]) => {
    const affordable =
      a.cost <= ap &&
      a.moveCost <= remainingMoves &&
      (a.id !== "wait" || canAffordWait(state, combatantId));
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
  };

  return `
    <div class="action-list">
      ${CATEGORY_ORDER.map((cat) => {
        const group = actions.filter((a) => a.category === cat);
        if (group.length === 0) return "";
        return `
          <div class="action-group-label">${CATEGORY_LABELS[cat]}</div>
          ${group.map(renderButton).join("")}
        `;
      }).join("")}
    </div>
  `;
}

export function bindDeclarationEvents(
  container: HTMLElement,
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
          selectAction(combatantId, actionId, cost, playerId, isGM);
        }
        break;
      }
      case "declare-done": {
        const combatantId = target.dataset.combatantId;
        if (combatantId) {
          declareDone(combatantId, playerId, isGM);
        }
        break;
      }
      case "lock-declaration": {
        const combatantId = target.dataset.combatantId;
        if (combatantId) {
          lockDeclaration(combatantId);
        }
        break;
      }
      case "unlock-declaration": {
        const combatantId = target.dataset.combatantId;
        if (combatantId && isGM) {
          unlockDeclaration(combatantId);
        }
        break;
      }
      case "undo-done-for-round": {
        const combatantId = target.dataset.combatantId;
        if (combatantId && isGM) {
          undoDoneForRound(combatantId);
        }
        break;
      }
      case "advance-resolution":
        if (isGM) advanceToResolution();
        break;
      case "force-end-round":
        if (isGM) forceEndRound();
        break;
    }
  });
}

function selectAction(
  combatantId: string,
  actionId: ActionId,
  cost: number,
  playerId: string,
  isGM: boolean,
): void {
  updateState((s) => {
    const c = s.combatants.find((c) => c.id === combatantId);
    if (!c) return s;

    const canDeclare = (isGM && c.side === "monster") || c.ownerId === playerId;
    if (!canDeclare) return s;

    const cycle = s.round!.currentCycle;
    const existing = cycle.declarations.filter((d) => d.combatantId !== combatantId);
    const newDecl: Declaration = {
      combatantId,
      actionId,
      cost,
      locked: false,
    };

    return {
      ...s,
      round: {
        ...s.round!,
        currentCycle: {
          ...cycle,
          declarations: [...existing, newDecl],
        },
      },
    };
  });
}

function declareDone(combatantId: string, playerId: string, isGM: boolean): void {
  updateState((s) => {
    const c = s.combatants.find((c) => c.id === combatantId);
    if (!c) return s;

    const canDeclare = (isGM && c.side === "monster") || c.ownerId === playerId;
    if (!canDeclare) return s;

    const round = s.round!;
    const cycle = round.currentCycle;
    // Remove any existing declaration for this combatant
    const existing = cycle.declarations.filter((d) => d.combatantId !== combatantId);
    // Add a locked "done" declaration for the current cycle
    const doneDecl: Declaration = {
      combatantId,
      actionId: "done",
      cost: 0,
      locked: true,
    };
    // Add to doneForRound so they stay done in future cycles
    const doneForRound = round.doneForRound.includes(combatantId)
      ? round.doneForRound
      : [...round.doneForRound, combatantId];

    return {
      ...s,
      round: {
        ...round,
        doneForRound,
        currentCycle: {
          ...cycle,
          declarations: [...existing, doneDecl],
        },
      },
    };
  });
}

function undoDoneForRound(combatantId: string): void {
  updateState((s) => ({
    ...s,
    round: {
      ...s.round!,
      doneForRound: s.round!.doneForRound.filter((id) => id !== combatantId),
    },
  }));
}

function lockDeclaration(combatantId: string): void {
  updateState((s) => {
    const cycle = s.round!.currentCycle;
    const declarations = cycle.declarations.map((d) =>
      d.combatantId === combatantId ? { ...d, locked: true } : d,
    );

    return {
      ...s,
      round: {
        ...s.round!,
        currentCycle: { ...cycle, declarations },
      },
    };
  });
}

function unlockDeclaration(combatantId: string): void {
  updateState((s) => {
    const cycle = s.round!.currentCycle;
    const declarations = cycle.declarations.map((d) =>
      d.combatantId === combatantId ? { ...d, locked: false } : d,
    );

    return {
      ...s,
      round: {
        ...s.round!,
        currentCycle: { ...cycle, declarations },
      },
    };
  });
}

function advanceToResolution(): void {
  updateState((s) => {
    const order = buildResolutionOrder(s);
    return {
      ...s,
      phase: "resolution",
      round: {
        ...s.round!,
        currentCycle: {
          ...s.round!.currentCycle,
          resolutionOrder: order,
          currentResolutionIndex: 0,
        },
      },
    };
  });
}

function forceEndRound(): void {
  updateState((s) => {
    const round = s.round!;
    const cycle = round.currentCycle;
    const apCurrent = deductCycleCosts(round.apCurrent, cycle.declarations);
    const movesUsed = deductCycleMoveCosts(round.movesUsed, cycle.declarations);

    return {
      ...s,
      phase: "round-end",
      round: {
        ...round,
        apCurrent,
        movesUsed,
        completedCycles: round.completedCycles + 1,
      },
    };
  });
}
