import type { CombatState, Combatant, Declaration } from "../../types";
import { saveState } from "../../state/store";
import { getCombatantById, getCurrentAp, anyoneCanAct } from "../../state/selectors";
import { ACTION_LIST } from "../../rules/actions";
import { deductCycleCosts, deductCycleMoveCosts } from "../../rules/resolution";
import { renderCombatantCard, type CardOptions } from "../components/combatant-card";

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
  const actionName = isDone
    ? "Done"
    : (ACTION_LIST.find((a) => a.id === decl.actionId)?.name ?? decl.actionId);
  const isCurrent = idx === currentIdx;
  const isResolved = idx < currentIdx;
  const isPending = idx > currentIdx;

  let rowClass = "resolution-row";
  if (isCurrent) rowClass += " current";
  if (isResolved) rowClass += " resolved";
  if (isPending) rowClass += " pending";
  if (isDone) rowClass += " resolution-done";

  const isOwner = c.ownerId === playerId;
  const ownerName =
    c.side === "monster" ? "GM" : partyPlayers.find((p) => p.id === c.ownerId)?.name;
  const marker = isResolved ? "&#x2713;" : isCurrent ? "&#x25B6;" : "&#x25CB;";
  const statusContent = `
    <span class="resolution-marker">${marker}</span>
    <span class="decl-action-label ${isDone ? "done-label" : ""}">${actionName}</span>
    ${isDone ? "" : `<span class="action-cost-badge">${decl.cost} AP</span>`}
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
  });
}

function resolveNext(state: CombatState): void {
  const cycle = state.round!.currentCycle;
  let idx = cycle.currentResolutionIndex;
  if (idx >= cycle.resolutionOrder.length) return;

  // Mark current declaration as resolved
  const currentId = cycle.resolutionOrder[idx];
  let declarations = cycle.declarations.map((d) =>
    d.combatantId === currentId ? { ...d, resolved: true } : d,
  );

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
