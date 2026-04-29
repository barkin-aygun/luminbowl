import { GameState } from './GameState.js';
import { LAYOUT_VERSION } from '../pitch/constants.js';

export const STORAGE_KEY = 'luminbowl_players';

export function loadState(key = STORAGE_KEY) {
  const saved = localStorage.getItem(key);
  if (!saved) return null;
  try {
    const data = JSON.parse(saved);
    if ((data.layoutVersion || 1) !== LAYOUT_VERSION) return null;
    return GameState.fromJSON(data);
  } catch (e) {
    return null;
  }
}

export function saveState(state, key = STORAGE_KEY) {
  localStorage.setItem(key, JSON.stringify({ layoutVersion: LAYOUT_VERSION, ...state.toJSON() }));
}
