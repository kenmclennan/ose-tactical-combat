import type { CombatState, CombatPhase } from "../types";
import { saveState, clearState } from "../state/store";
import { renderSetupView, bindSetupEvents } from "./views/setup";
import { renderRoundStartView, bindRoundStartEvents } from "./views/round-start";
import { renderDeclarationView, bindDeclarationEvents } from "./views/declaration";
import { renderResolutionView, bindResolutionEvents } from "./views/resolution";
import { renderRoundEndView, bindRoundEndEvents } from "./views/round-end";
import { bindFuryEvents } from "./components/fury-panel";

const PHASE_LABELS: Record<CombatPhase, string> = {
  setup: "Setup",
  "round-start": "Round Start",
  declaration: "Declaration",
  resolution: "Resolution",
  "cycle-end": "Cycle End",
  "round-end": "Round End",
  "combat-end": "Combat End",
};

export interface RenderContext {
  state: CombatState | null;
  playerId: string;
  playerRole: string;
  connected: boolean;
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

  switch (state.phase) {
    case "setup":
      return renderSetupView(state, playerId, isGM);
    case "round-start":
      return renderRoundStartView(state, playerId, isGM);
    case "declaration":
      return renderDeclarationView(state, playerId, isGM);
    case "resolution":
      return renderResolutionView(state, playerId, isGM);
    case "cycle-end":
      return renderResolutionView(state, playerId, isGM);
    case "round-end":
      return renderRoundEndView(state, playerId, isGM);
    case "combat-end":
      return `
        <div class="empty-state">
          <div class="empty-state-icon">&#x2694;</div>
          <div>Combat has ended</div>
          ${isGM ? `<button class="btn btn-primary" data-action="new-combat" style="margin-top: 12px;">New Combat</button>` : ""}
        </div>
      `;
    default:
      return `<div class="empty-state">Unknown phase</div>`;
  }
}

function bindPhaseEvents(content: HTMLElement, ctx: RenderContext): void {
  const { state, playerId, playerRole } = ctx;
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
  });

  if (!state) return;

  // Phase-specific events
  switch (state.phase) {
    case "setup":
      bindSetupEvents(content, state, playerId, isGM);
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
      if (state.fury.current > 0) bindFuryEvents(content, state, playerId);
      break;
    case "round-end":
      bindRoundEndEvents(content, state, playerId, isGM);
      break;
  }
}
