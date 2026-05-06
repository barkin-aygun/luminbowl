import { GameState } from './GameState.js';
import { LAYOUT_VERSION, GAME_VERSION } from '../pitch/constants.js';

export const STORAGE_KEY = 'luminbowl_players';

export function loadState(key = STORAGE_KEY) {
  const saved = localStorage.getItem(key);
  if (!saved) return null;
  try {
    const data = JSON.parse(saved);
    if ((data.layoutVersion ?? 1) !== LAYOUT_VERSION) return null;
    // Keep players but drop stale turn state on game version mismatch
    if ((data.gameVersion ?? 0) !== GAME_VERSION) delete data.turnState;
    return GameState.fromJSON(data);
  } catch {
    return null;
  }
}

export function saveState(state, key = STORAGE_KEY) {
  localStorage.setItem(key, JSON.stringify({
    layoutVersion: LAYOUT_VERSION,
    gameVersion: GAME_VERSION,
    ...GameState.toJSON(state)
  }));
}
