import type { CombatState, CombatPhase } from "../types";
import { saveState, clearState } from "../state/store";
import { loadRoster, rosterToCombatant } from "../state/roster";
import { generateId } from "../util/ids";
import { renderSetupView, bindSetupEvents, showEditModalHandler, showAddModalHandler } from "./views/setup";
import { showModal, closeModal } from "./modal";
import { saveRoster } from "../state/roster";
import { renderRoundStartView, bindRoundStartEvents } from "./views/round-start";
import { renderDeclarationView, bindDeclarationEvents } from "./views/declaration";
import { renderResolutionView, bindResolutionEvents } from "./views/resolution";
import { renderRoundEndView, bindRoundEndEvents } from "./views/round-end";
import { showFuryModal } from "./components/fury-panel";
import { bindCardEvents } from "./components/combatant-card";

const PHASE_LABELS: Record<CombatPhase, string> = {
  setup: "Setup",
  "round-start": "Round Start",
  declaration: "Declaration",
  resolution: "Resolution",
  "cycle-end": "Cycle End",
  "round-end": "Round End",
  "combat-end": "Combat End",
};

export interface PartyPlayer {
  id: string;
  name: string;
}

export interface RenderContext {
  state: CombatState | null;
  playerId: string;
  playerRole: string;
  connected: boolean;
  partyPlayers: PartyPlayer[];
}

export function render(app: HTMLElement, ctx: RenderContext): void {
  const { state, playerRole, connected } = ctx;
  const isGM = playerRole === "GM";

  const statusClass = connected ? "status-connected" : "status-disconnected";
  const statusText = connected ? "Connected" : "Disconnected";
  const roleBadge = isGM ? "role-gm" : "role-player";
  const phase = state?.phase ?? null;
  const roundInfo = state?.round
    ? `Round ${state.round.roundNumber}, Cycle ${state.round.currentCycle.cycleNumber}`
    : "";
  const showFuryBadge = state && phase && phase !== "setup" && phase !== "combat-end";
  const furyBadgeHtml = showFuryBadge
    ? `<span class="fury-badge clickable" data-action="open-fury-modal">${state!.fury.current} Fury</span>`
    : "";

  app.innerHTML = `
    <div class="header">
      <span class="header-title">Tactical Initiative</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="role-badge ${roleBadge}">${playerRole}</span>
        <span class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          ${statusText}
        </span>
      </div>
    </div>
    ${phase ? `<div class="phase-banner"><span>${PHASE_LABELS[phase]}${roundInfo ? ` - ${roundInfo}` : ""}</span>${furyBadgeHtml}</div>` : ""}
    <div class="content" id="phase-content">
      ${renderPhaseContent(ctx)}
    </div>
  `;

  // Bind fury badge click (in phase banner, outside #phase-content)
  const furyBadge = app.querySelector("[data-action='open-fury-modal']") as HTMLElement | null;
  if (furyBadge && state) {
    furyBadge.addEventListener("click", () => {
      showFuryModal(state, ctx.playerId, isGM);
    });
  }

  const content = app.querySelector("#phase-content") as HTMLElement;
  if (content) {
    bindPhaseEvents(content, ctx);
  }
}

function renderPhaseContent(ctx: RenderContext): string {
  const { state, playerId, playerRole, connected } = ctx;
  const isGM = playerRole === "GM";

  if (!connected) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">&#x26A0;</div>
        <div>Waiting for connection...</div>
      </div>
    `;
  }

  if (!state) {
    if (isGM) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">&#x2694;</div>
          <div>No active combat</div>
          <button class="btn btn-primary" data-action="new-combat" style="margin-top: 12px;">New Combat</button>
        </div>
      `;
    }
    return `
      <div class="empty-state">
        <div class="empty-state-icon">&#x2694;</div>
        <div>Waiting for GM to start combat...</div>
      </div>
    `;
  }

  let phaseHtml: string;
  switch (state.phase) {
    case "setup":
      phaseHtml = renderSetupView(state, playerId, isGM, ctx.partyPlayers);
      break;
    case "round-start":
      phaseHtml = renderRoundStartView(state, playerId, isGM);
      break;
    case "declaration":
      phaseHtml = renderDeclarationView(state, playerId, isGM, ctx.partyPlayers);
      break;
    case "resolution":
      phaseHtml = renderResolutionView(state, playerId, isGM);
      break;
    case "cycle-end":
      phaseHtml = renderResolutionView(state, playerId, isGM);
      break;
    case "round-end":
      phaseHtml = renderRoundEndView(state, playerId, isGM);
      break;
    case "combat-end":
      phaseHtml = `
        <div class="empty-state">
          <div class="empty-state-icon">&#x2694;</div>
          <div>Combat has ended</div>
          ${isGM ? `<button class="btn btn-primary" data-action="new-combat" style="margin-top: 12px;">New Combat</button>` : ""}
        </div>
      `;
      break;
    default:
      phaseHtml = `<div class="empty-state">Unknown phase</div>`;
  }


  // Append persistent "End Combat" footer for GM during active combat phases
  const showEndCombat = isGM && state.phase !== "setup" && state.phase !== "combat-end";
  if (showEndCombat) {
    phaseHtml += `
      <div class="combat-footer">
        <button class="btn btn-secondary btn-full" data-action="end-combat">End Combat</button>
      </div>
    `;
  }

  return phaseHtml;
}

function bindPhaseEvents(content: HTMLElement, ctx: RenderContext): void {
  const { state, playerId, playerRole, partyPlayers } = ctx;
  const isGM = playerRole === "GM";

  // Global actions
  content.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;

    if (action === "new-combat" && isGM) {
      loadRoster().then((roster) => {
        const combatants = roster.map((entry) => rosterToCombatant(entry, generateId()));
        saveState({
          version: 1,
          phase: "setup",
          combatants,
          round: null,
          fury: { current: 0, log: [] },
          gmId: playerId,
        });
      });
    }

    if (action === "cancel-setup" && isGM) {
      clearState();
    }

    if (action === "end-combat" && isGM && state) {
      // Save player roster before clearing
      const players = state.combatants.filter((c) => c.side === "player");
      if (players.length > 0) {
        saveRoster(players);
      }
      clearState();
    }

    // Global edit-combatant handler - works from any phase
    if (action === "edit-combatant" && state) {
      const id = target.dataset.id;
      if (id) {
        const c = state.combatants.find((c) => c.id === id);
        if (!c) return;
        const canEdit = isGM || c.ownerId === playerId;
        if (canEdit) {
          showEditModalHandler(state, id, isGM, playerId, partyPlayers);
        }
      }
    }

    // Global remove-combatant handler with confirmation
    if (action === "remove-combatant" && state && isGM) {
      const id = target.dataset.id;
      if (id) {
        const c = state.combatants.find((c) => c.id === id);
        if (!c) return;
        const name = c.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        showModal(`
          <div class="modal-overlay" data-modal-overlay="true">
            <div class="modal">
              <div class="modal-header">
                <span class="modal-title">Remove Combatant</span>
                <button class="btn-icon" data-action="close-modal">&#x2715;</button>
              </div>
              <div class="modal-body">
                <p>Remove <strong>${name}</strong> from combat?</p>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
                <button class="btn btn-primary" data-action="confirm-remove" data-id="${c.id}">Remove</button>
              </div>
            </div>
          </div>
        `, (modalAction, data) => {
          if (modalAction === "confirm-remove" && data.id) {
            const updated: CombatState = {
              ...state,
              combatants: state.combatants.filter((c) => c.id !== data.id),
            };
            // Also remove from doneForRound if present
            if (updated.round?.doneForRound) {
              updated.round = {
                ...updated.round,
                doneForRound: updated.round.doneForRound.filter((did) => did !== data.id),
              };
            }
            saveState(updated);
            closeModal();
          }
        });
      }
    }

    // Global add-combatant handler (works from any phase for GM)
    if (action === "add-combatant" && state && isGM) {
      const side = target.dataset.side as "player" | "monster" | undefined;
      if (side) {
        showAddModalHandler(state, side, playerId, isGM, partyPlayers, state.phase !== "setup");
      }
    }

    // Global toggle-status handler
    if (action === "toggle-status" && state && isGM) {
      const id = target.dataset.id;
      if (id) {
        const combatants = state.combatants.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            status: c.status === "active" ? ("incapacitated" as const) : ("active" as const),
          };
        });
        saveState({ ...state, combatants });
      }
    }
  });

  if (!state) return;

  // Bind card events (inline HP/AP editing) for phases that use combatant cards
  if (state.phase !== "setup") {
    bindCardEvents(content, state, playerId, isGM, partyPlayers);
  }

  // Phase-specific events
  switch (state.phase) {
    case "setup":
      bindSetupEvents(content, state, playerId, isGM, ctx.partyPlayers);
      break;
    case "round-start":
      bindRoundStartEvents(content, state, playerId, isGM);
      break;
    case "declaration":
      bindDeclarationEvents(content, state, playerId, isGM);
      break;
    case "resolution":
    case "cycle-end":
      bindResolutionEvents(content, state, playerId, isGM);
      break;
    case "round-end":
      bindRoundEndEvents(content, state, playerId, isGM);
      break;
  }
}
