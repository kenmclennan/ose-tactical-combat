import type { CombatState } from "../../types";
import { saveState } from "../../state/store";
import { getActiveCombatants, getPlayerCombatants, getCurrentAp } from "../../state/selectors";
import { calculateFuryBanked } from "../../rules/fury";

export function renderRoundEndView(
  state: CombatState,
  _playerId: string,
  isGM: boolean,
): string {
  const round = state.round!;
  const furyBanked = calculateFuryBanked(state);
  const players = getPlayerCombatants(state).filter((c) => c.status === "active");

  return `
    <div class="round-end-view">
      <div class="round-header">Round ${round.roundNumber} Complete</div>
      <div class="round-summary">
        <div class="summary-item">
          <span class="summary-label">Cycles</span>
          <span class="summary-value">${round.completedCycles}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Fury Banked</span>
          <span class="summary-value fury-value">+${furyBanked}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Fury Pool</span>
          <span class="summary-value fury-value">${state.fury.current + furyBanked}</span>
        </div>
      </div>
      <div class="leftover-ap">
        <div class="section-title">Leftover AP</div>
        ${players.map((c) => {
          const ap = getCurrentAp(state, c.id);
          const fury = Math.floor(ap / 2);
          return `
            <div class="leftover-row">
              <span>${escapeHtml(c.name)}</span>
              <span class="stat">${ap} AP = ${fury} Fury</span>
            </div>
          `;
        }).join("")}
      </div>
      ${isGM ? `
        <div class="round-end-actions">
          <button class="btn btn-primary btn-full" data-action="next-round">Next Round</button>
        </div>
      ` : `
        <div class="hint">Waiting for GM...</div>
      `}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function bindRoundEndEvents(
  container: HTMLElement,
  state: CombatState,
  _playerId: string,
  isGM: boolean,
): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;

    if (action === "next-round" && isGM) {
      nextRound(state);
    }
  });
}

function nextRound(state: CombatState): void {
  const round = state.round!;
  const furyBanked = calculateFuryBanked(state);

  // Clear surprise for next round
  const combatants = state.combatants.map((c) => ({
    ...c,
    surprised: false,
  }));

  saveState({
    ...state,
    phase: "round-start",
    combatants,
    fury: {
      current: state.fury.current + furyBanked,
      log: [
        ...state.fury.log.slice(-19),
        {
          type: "bank" as const,
          amount: furyBanked,
          round: round.roundNumber,
        },
      ],
    },
    round: {
      roundNumber: round.roundNumber + 1,
      apRolls: {},
      apCurrent: {},
      currentCycle: {
        cycleNumber: 1,
        declarations: [],
        resolutionOrder: [],
        currentResolutionIndex: 0,
      },
      completedCycles: 0,
    },
  });
}
