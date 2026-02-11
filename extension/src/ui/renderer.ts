import type { CombatState, CombatPhase } from "../types";
import { saveState, clearState } from "../state/store";
import { renderSetupView, bindSetupEvents, showEditModalHandler } from "./views/setup";
import { renderRoundStartView, bindRoundStartEvents } from "./views/round-start";
import { renderDeclarationView, bindDeclarationEvents } from "./views/declaration";
import { renderResolutionView, bindResolutionEvents } from "./views/resolution";
import { renderRoundEndView, bindRoundEndEvents } from "./views/round-end";
import { renderFuryPanel, bindFuryEvents } from "./components/fury-panel";
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
  const furyInfo = state && state.fury.current > 0
    ? `<span class="fury-badge">${state.fury.current} Fury</span>`
    : "";

  app.innerHTML = `
    <div class="header">
      <span class="header-title">Tactical Initiative</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${furyInfo}
        <span class="role-badge ${roleBadge}">${playerRole}</span>
        <span class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          ${statusText}
        </span>
      </div>
    </div>
    ${phase ? `<div class="phase-banner">${PHASE_LABELS[phase]}${roundInfo ? ` - ${roundInfo}` : ""}</div>` : ""}
    <div class="content" id="phase-content">
      ${renderPhaseContent(ctx)}
    </div>
  `;

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
      phaseHtml = renderDeclarationView(state, playerId, isGM);
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

  // Persistent fury panel - show during any combat phase when fury > 0
  const showFury = state.phase !== "setup" && state.phase !== "combat-end" && state.fury.current > 0;
  if (showFury) {
    phaseHtml += renderFuryPanel(state, isGM);
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
      saveState({
        version: 1,
        phase: "setup",
        combatants: [],
        round: null,
        fury: { current: 0, log: [] },
        gmId: playerId,
      });
    }

    if (action === "end-combat" && isGM) {
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

  // Bind fury events when fury panel is visible
  const showFury = state.phase !== "setup" && state.phase !== "combat-end" && state.fury.current > 0;
  if (showFury) {
    bindFuryEvents(content, state, playerId, isGM);
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
