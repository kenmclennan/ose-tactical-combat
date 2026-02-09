import OBR from "@owlbear-rodeo/sdk";
import type { CombatState } from "../types";
import { METADATA_KEY } from "../types";

type Listener = (state: CombatState | null) => void;

let currentState: CombatState | null = null;
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
  currentState = state;
  notifyListeners();
  await OBR.room.setMetadata({ [METADATA_KEY]: state });
}

export async function clearState(): Promise<void> {
  currentState = null;
  notifyListeners();
  await OBR.room.setMetadata({ [METADATA_KEY]: undefined });
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function initSync(): () => void {
  return OBR.room.onMetadataChange((metadata) => {
    const raw = metadata[METADATA_KEY];
    currentState = (raw as CombatState) ?? null;
    notifyListeners();
  });
}
