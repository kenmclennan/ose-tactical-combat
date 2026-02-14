import type { CombatState } from "../../types";
import { updateState } from "../../state/store";
import { getPlayerCombatants, getCurrentAp } from "../../state/selectors";
import { calculateFuryBanked } from "../../rules/fury";
import { MAX_FURY_PER_PLAYER_PER_ROUND } from "../../util/constants";

export function renderRoundEndView(state: CombatState, _playerId: string, isGM: boolean): string {
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
        ${players
          .map((c) => {
            const ap = getCurrentAp(state, c.id);
            const fury = Math.min(ap, MAX_FURY_PER_PLAYER_PER_ROUND);
            const capped = ap > MAX_FURY_PER_PLAYER_PER_ROUND;
            return `
            <div class="leftover-row">
              <span>${escapeHtml(c.name)}</span>
              <span class="stat">${ap} AP = ${fury} Fury${capped ? " (capped)" : ""}</span>
            </div>
          `;
          })
          .join("")}
      </div>
      ${
        isGM
          ? `
        <div class="round-end-actions">
          <div class="round-actions-row">
            <button class="btn btn-secondary" data-action="end-combat">End Combat</button>
            <button class="btn btn-primary" data-action="next-round">Next Round</button>
          </div>
        </div>
      `
          : `
        <div class="hint">Waiting for GM...</div>
      `
      }
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function bindRoundEndEvents(container: HTMLElement, _playerId: string, isGM: boolean): void {
  container.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;

    if (action === "next-round" && isGM) {
      nextRound();
    }
  });
}

function nextRound(): void {
  updateState((s) => {
    const round = s.round!;
    const furyBanked = calculateFuryBanked(s);

    const combatants = s.combatants.map((c) => ({
      ...c,
      surprised: false,
    }));

    return {
      ...s,
      phase: "round-start",
      combatants,
      fury: {
        current: s.fury.current + furyBanked,
        log: [
          ...s.fury.log.slice(-19),
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
        movesUsed: {},
        currentCycle: {
          cycleNumber: 1,
          declarations: [],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: [],
        },
        completedCycles: 0,
        doneForRound: [],
      },
    };
  });
}
