import type { CombatState, Combatant, Declaration, ActionId } from "../../types";
import { saveState } from "../../state/store";
import {
  getCombatantById,
  getCurrentAp,
  anyoneCanAct,
  isWaiting,
  getFollowUpActions,
} from "../../state/selectors";
import { ACTION_LIST, CATEGORY_ORDER, CATEGORY_LABELS } from "../../rules/actions";
import { deductCycleCosts, deductCycleMoveCosts } from "../../rules/resolution";
import { renderCombatantCard, type CardOptions } from "../components/combatant-card";
import { showModal, closeModal } from "../modal";

export function renderResolutionView(
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: { id: string; name: string }[] = [],
): string {
  const cycle = state.round!.currentCycle;
  const order = cycle.resolutionOrder;
  const currentIdx = cycle.currentResolutionIndex;
  const allResolved = currentIdx >= order.length;

  return `
    <div class="resolution-view">
      <div class="resolution-list">
        ${renderGroupedRows(order, cycle, currentIdx, state, playerId, isGM, partyPlayers)}
        ${order.length === 0 ? `<div class="empty-list">No declarations to resolve</div>` : ""}
      </div>
      ${
        isGM
          ? `
        <div class="resolution-actions">
          ${
            !allResolved
              ? `
            <div class="round-actions-row">
              <button class="btn btn-secondary" data-action="end-combat">End Combat</button>
              <button class="btn btn-primary" data-action="resolve-next">Next: ${getNextLabel(state)}</button>
            </div>
          `
              : `
            <div class="round-actions-row">
              <button class="btn btn-secondary" data-action="end-combat">End Combat</button>
              <button class="btn btn-secondary" data-action="force-end-round">End Round</button>
              <button class="btn btn-primary" data-action="end-cycle">End Cycle</button>
            </div>
          `
          }
        </div>
      `
          : `
        <div class="hint">${allResolved ? "Waiting for GM to end cycle..." : "Resolving actions..."}</div>
      `
      }
    </div>
  `;
}

function renderGroupedRows(
  order: string[],
  cycle: CombatState["round"] extends infer R
    ? R extends { currentCycle: infer C }
      ? C
      : never
    : never,
  currentIdx: number,
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: { id: string; name: string }[],
): string {
  // Build entries with original index (for resolved/current/pending status)
  const entries = order.map((id, idx) => ({ id, idx }));

  // Sort by current AP descending so group headers stay in order after fury changes
  entries.sort((a, b) => getCurrentAp(state, b.id) - getCurrentAp(state, a.id));

  let html = "";
  let lastAp: number | null = null;

  for (const { id, idx } of entries) {
    const c = getCombatantById(state, id);
    const decl = cycle.declarations.find((d: Declaration) => d.combatantId === id);
    if (!c || !decl) continue;

    const ap = getCurrentAp(state, c.id);
    if (ap !== lastAp) {
      html += `<div class="ap-group-header">${ap} AP</div>`;
      lastAp = ap;
    }
    html += renderResolutionRow(c, decl, idx, currentIdx, state, playerId, isGM, partyPlayers);
  }
  return html;
}

function renderResolutionRow(
  c: Combatant,
  decl: Declaration,
  idx: number,
  currentIdx: number,
  state: CombatState,
  playerId: string,
  isGM: boolean,
  partyPlayers: { id: string; name: string }[],
): string {
  const _ap = getCurrentAp(state, c.id);
  const isDone = decl.actionId === "done";
  const combatantIsWaiting = isWaiting(state, c.id);
  // Check for follow-up declaration (second declaration for same combatant)
  const allDecls = state.round!.currentCycle.declarations.filter((d) => d.combatantId === c.id);
  const followUpDecl = allDecls.length > 1 ? allDecls[1] : undefined;

  let actionName: string;
  let costDisplay: string;
  if (combatantIsWaiting && !followUpDecl) {
    actionName = "Wait";
    costDisplay = `<span class="action-cost-badge">1 AP</span>`;
  } else if (followUpDecl) {
    const followUpAction = ACTION_LIST.find((a) => a.id === followUpDecl.actionId);
    const followUpName = followUpAction?.name ?? followUpDecl.actionId;
    const totalCost = decl.cost + followUpDecl.cost;
    actionName = `Wait + ${followUpName}`;
    costDisplay = `<span class="action-cost-badge">${totalCost} AP</span>`;
  } else if (isDone) {
    actionName = "Done";
    costDisplay = "";
  } else {
    actionName = ACTION_LIST.find((a) => a.id === decl.actionId)?.name ?? decl.actionId;
    costDisplay = `<span class="action-cost-badge">${decl.cost} AP</span>`;
  }

  const isCurrent = idx === currentIdx;
  const isResolved = idx < currentIdx;
  const isPending = idx > currentIdx;

  let rowClass = "resolution-row";
  if (isCurrent) rowClass += " current";
  if (isResolved && !combatantIsWaiting) rowClass += " resolved";
  if (isPending) rowClass += " pending";
  if (isDone) rowClass += " resolution-done";

  const isOwner = c.ownerId === playerId;
  const ownerName =
    c.side === "monster" ? "GM" : partyPlayers.find((p) => p.id === c.ownerId)?.name;
  const marker = isResolved ? "&#x2713;" : isCurrent ? "&#x25B6;" : "&#x25CB;";

  const isWaitAction = decl.actionId === "wait";
  let waitingBadge = "";
  if (isWaitAction && !followUpDecl) {
    if (combatantIsWaiting) {
      // Resolved wait - clickable badge to open follow-up modal
      waitingBadge = ` <span class="badge badge-warning clickable" data-action="open-follow-up" data-combatant-id="${c.id}">Waiting</span>`;
    } else {
      // Pending/current wait - display-only badge
      waitingBadge = ` <span class="badge badge-warning">Waiting</span>`;
    }
  }

  const statusContent = `
    <span class="resolution-marker">${marker}</span>
    <span class="decl-action-label ${isDone ? "done-label" : ""}">${actionName}</span>
    ${costDisplay}${waitingBadge}
  `;
  const cardOpts: CardOptions = {
    showAp: true,
    showEdit: true,
    showStatusToggle: true,
    showRemove: true,
    isGM,
    isOwner,
    playerId,
    ownerName,
    statusContent,
  };

  return `
    <div class="${rowClass}">
      ${renderCombatantCard(c, state, cardOpts)}
    </div>
  `;
}

function getNextLabel(state: CombatState): string {
  const cycle = state.round!.currentCycle;
  const idx = cycle.currentResolutionIndex;
  if (idx >= cycle.resolutionOrder.length) return "End Cycle";
  const id = cycle.resolutionOrder[idx];
  const c = getCombatantById(state, id);
  const decl = cycle.declarations.find((d) => d.combatantId === id);
  if (decl?.actionId === "done") return c ? `${escapeHtml(c.name)} (Done)` : "Done";
  return c ? escapeHtml(c.name) : "Unknown";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function bindResolutionEvents(
  container: HTMLElement,
  state: CombatState,
  playerId: string,
  isGM: boolean,
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;

    if (action === "resolve-next" && isGM) {
      resolveNext(state);
    }
    if (action === "end-cycle" && isGM) {
      endCycle(state);
    }
    if (action === "force-end-round" && isGM) {
      forceEndRound(state);
    }
    if (action === "open-follow-up") {
      const combatantId = target.dataset.combatantId;
      if (!combatantId) return;
      const c = getCombatantById(state, combatantId);
      if (!c) return;
      const canOpen = isGM || c.ownerId === playerId;
      if (canOpen) showFollowUpModal(state, combatantId);
    }
  });
}

function resolveNext(state: CombatState): void {
  const cycle = state.round!.currentCycle;
  let idx = cycle.currentResolutionIndex;
  if (idx >= cycle.resolutionOrder.length) return;

  // Mark current declaration as resolved
  const currentId = cycle.resolutionOrder[idx];
  const currentDecl = cycle.declarations.find((d) => d.combatantId === currentId);
  let declarations = cycle.declarations.map((d) =>
    d.combatantId === currentId ? { ...d, resolved: true } : d,
  );

  // If the resolved action is "wait", add combatant to waitingCombatants
  let waitingCombatants = cycle.waitingCombatants;
  if (currentDecl?.actionId === "wait" && !waitingCombatants.includes(currentId)) {
    waitingCombatants = [...waitingCombatants, currentId];
  }

  idx += 1;

  // Auto-skip any "done" declarations
  while (idx < cycle.resolutionOrder.length) {
    const nextId = cycle.resolutionOrder[idx];
    const nextDecl = declarations.find((d) => d.combatantId === nextId);
    if (nextDecl?.actionId === "done") {
      declarations = declarations.map((d) =>
        d.combatantId === nextId ? { ...d, resolved: true } : d,
      );
      idx += 1;
    } else {
      break;
    }
  }

  saveState({
    ...state,
    round: {
      ...state.round!,
      currentCycle: {
        ...cycle,
        declarations,
        currentResolutionIndex: idx,
        waitingCombatants,
      },
    },
  });
}

function showFollowUpModal(state: CombatState, combatantId: string): void {
  const c = getCombatantById(state, combatantId);
  if (!c) return;
  const actions = getFollowUpActions(state, combatantId);
  const name = escapeHtml(c.name);

  const actionButtons = CATEGORY_ORDER.map((cat) => {
    const group = actions.filter((a) => a.category === cat);
    if (group.length === 0) return "";
    return `
      <div class="action-group-label">${CATEGORY_LABELS[cat]}</div>
      ${group
        .map(
          (a) => `
        <button
          class="action-btn"
          data-action="select-follow-up"
          data-action-id="${a.id}"
          data-cost="${a.cost}"
          title="${a.description}"
        >
          <span class="action-cost">${a.cost}</span>
          <span class="action-name">${a.name}</span>
        </button>
      `,
        )
        .join("")}
    `;
  }).join("");

  showModal(
    `
    <div class="modal-overlay" data-modal-overlay="true">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Follow-Up: ${name}</span>
          <button class="btn-icon" data-action="close-modal">&#x2715;</button>
        </div>
        <div class="modal-body">
          <div class="action-list">
            ${actionButtons}
          </div>
        </div>
      </div>
    </div>
  `,
    (action, data) => {
      if (action === "select-follow-up") {
        const actionId = data.actionId as ActionId;
        const cost = parseInt(data.cost || "0");
        if (actionId) {
          selectFollowUp(state, combatantId, actionId, cost);
          closeModal();
        }
      }
    },
  );
}

function selectFollowUp(
  state: CombatState,
  combatantId: string,
  actionId: ActionId,
  cost: number,
): void {
  const cycle = state.round!.currentCycle;
  const followUpDecl: Declaration = {
    combatantId,
    actionId,
    cost,
    locked: true,
    resolved: true,
  };

  saveState({
    ...state,
    round: {
      ...state.round!,
      currentCycle: {
        ...cycle,
        declarations: [...cycle.declarations, followUpDecl],
        waitingCombatants: cycle.waitingCombatants.filter((id) => id !== combatantId),
      },
    },
  });
}

function endCycle(state: CombatState): void {
  const round = state.round!;
  const cycle = round.currentCycle;

  // Deduct AP and move costs
  const apCurrent = deductCycleCosts(round.apCurrent, cycle.declarations);
  const movesUsed = deductCycleMoveCosts(round.movesUsed, cycle.declarations);

  // Check if anyone can still act
  const testState: CombatState = {
    ...state,
    round: { ...round, apCurrent, movesUsed },
  };

  if (anyoneCanAct(testState)) {
    saveState({
      ...state,
      phase: "declaration",
      round: {
        ...round,
        apCurrent,
        movesUsed,
        currentCycle: {
          cycleNumber: cycle.cycleNumber + 1,
          declarations: [],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: [],
        },
        completedCycles: round.completedCycles + 1,
      },
    });
  } else {
    saveState({
      ...state,
      phase: "round-end",
      round: {
        ...round,
        apCurrent,
        movesUsed,
        completedCycles: round.completedCycles + 1,
      },
    });
  }
}

function forceEndRound(state: CombatState): void {
  const round = state.round!;
  const cycle = round.currentCycle;
  const apCurrent = deductCycleCosts(round.apCurrent, cycle.declarations);
  const movesUsed = deductCycleMoveCosts(round.movesUsed, cycle.declarations);

  saveState({
    ...state,
    phase: "round-end",
    round: {
      ...round,
      apCurrent,
      movesUsed,
      completedCycles: round.completedCycles + 1,
    },
  });
}
