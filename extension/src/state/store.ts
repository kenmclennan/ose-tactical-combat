import OBR from "@owlbear-rodeo/sdk";
import type { CombatState } from "../types";
import { METADATA_KEY } from "../types";

type Listener = (state: CombatState | null) => void;

let currentState: CombatState | null = null;
let pendingWrites = 0;
const listeners: Set<Listener> = new Set();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(currentState);
  }
}

export function getState(): CombatState | null {
  return currentState;
}

export async function loadState(): Promise<CombatState | null> {
  const metadata = await OBR.room.getMetadata();
  const raw = metadata[METADATA_KEY];
  currentState = (raw as CombatState) ?? null;
  notifyListeners();
  return currentState;
}

export async function saveState(state: CombatState): Promise<void> {
  pendingWrites++;
  currentState = state;
  notifyListeners();
  await OBR.room.setMetadata({ [METADATA_KEY]: state });
  pendingWrites--;
}

export async function clearState(): Promise<void> {
  pendingWrites++;
  currentState = null;
  notifyListeners();
  await OBR.room.setMetadata({ [METADATA_KEY]: undefined });
  pendingWrites--;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function updateState(updater: (current: CombatState) => CombatState): Promise<void> {
  const current = getState();
  if (!current) return;
  const next = updater(current);
  await saveState(next);
}

export function initSync(): () => void {
  return OBR.room.onMetadataChange((metadata) => {
    if (pendingWrites > 0) return;
    const raw = metadata[METADATA_KEY];
    currentState = (raw as CombatState) ?? null;
    notifyListeners();
  });
}
