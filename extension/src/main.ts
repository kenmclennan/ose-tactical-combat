import OBR, { type Theme } from "@owlbear-rodeo/sdk";
import { loadState, subscribe, initSync } from "./state/store";
import { render } from "./ui/renderer";
import type { PartyPlayer } from "./ui/renderer";
import type { CombatState } from "./types";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app element");

let playerId = "";
let playerRole = "";
let connected = false;
let partyPlayers: PartyPlayer[] = [];

function doRender(state: CombatState | null): void {
  render(app!, { state, playerId, playerRole, connected, partyPlayers });
}

OBR.onReady(async () => {
  playerId = OBR.player.id;
  playerRole = await OBR.player.getRole();
  connected = true;

  // Apply OBR theme
  const theme = await OBR.theme.getTheme();
  applyTheme(theme);
  OBR.theme.onChange(applyTheme);

  // Track party players for owner assignment
  const currentName = await OBR.player.getName();
  partyPlayers = [{ id: playerId, name: currentName }];

  const otherPlayers = await OBR.party.getPlayers();
  partyPlayers = [
    { id: playerId, name: currentName },
    ...otherPlayers.map((p) => ({ id: p.id, name: p.name })),
  ];

  OBR.party.onChange((players) => {
    partyPlayers = [
      { id: playerId, name: currentName },
      ...players.map((p) => ({ id: p.id, name: p.name })),
    ];
    // Re-render with updated player list
    loadState().then(doRender);
  });

  // Load initial state and start syncing
  const state = await loadState();
  initSync();
  doRender(state);

  // Re-render on state changes
  subscribe(doRender);
});

// Show disconnected state initially
doRender(null);

function applyTheme(theme: Theme): void {
  if (theme.mode === "LIGHT") {
    document.documentElement.style.setProperty("--bg-primary", "#f5f5f5");
    document.documentElement.style.setProperty("--bg-secondary", "#ffffff");
    document.documentElement.style.setProperty("--bg-surface", "#eeeeee");
    document.documentElement.style.setProperty("--text-primary", "#1a1a1a");
    document.documentElement.style.setProperty("--text-secondary", "#555555");
    document.documentElement.style.setProperty("--text-muted", "#888888");
    document.documentElement.style.setProperty("--border", "#dddddd");
  } else {
    document.documentElement.style.setProperty("--bg-primary", "#1a1a2e");
    document.documentElement.style.setProperty("--bg-secondary", "#222244");
    document.documentElement.style.setProperty("--bg-surface", "#2a2a4a");
    document.documentElement.style.setProperty("--text-primary", "#e0e0e0");
    document.documentElement.style.setProperty("--text-secondary", "#a0a0b0");
    document.documentElement.style.setProperty("--text-muted", "#666680");
    document.documentElement.style.setProperty("--border", "#3a3a5a");
  }
  document.documentElement.style.setProperty("--accent", theme.primary.main);
}
