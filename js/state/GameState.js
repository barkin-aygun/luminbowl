import { RED_POSITIONS, BLUE_POSITIONS } from '../pitch/constants.js';

export class GameState {
  constructor(players) {
    this.players = players;
  }

  static createDefault() {
    const players = [];
    for (let i = 0; i < 11; i++) {
      players.push({
        id: i, team: 'red', number: i + 1, outlineColor: 'white', notes: '',
        col: RED_POSITIONS[i][0], row: RED_POSITIONS[i][1]
      });
    }
    for (let i = 0; i < 11; i++) {
      players.push({
        id: i + 11, team: 'blue', number: i + 1, outlineColor: 'white', notes: '',
        col: BLUE_POSITIONS[i][0], row: BLUE_POSITIONS[i][1]
      });
    }
    return new GameState(players);
  }

  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    // Support legacy format (bare array) and new format (object with players)
    const players = Array.isArray(data) ? data : data.players;
    if (!players || players.length !== 22) return null;
    return new GameState(players);
  }

  toJSON() {
    return { players: this.players };
  }

  snapshot() {
    return GameState.fromJSON(JSON.parse(JSON.stringify(this.toJSON())));
  }

  getPlayer(id) {
    return this.players[id];
  }

  getPlayerAt(col, row) {
    return this.players.find(p => p.col === col && p.row === row) || null;
  }

  movePlayer(id, col, row) {
    const existing = this.getPlayerAt(col, row);
    if (existing && existing.id !== id) return false;
    const p = this.players[id];
    p.col = col;
    p.row = row;
    return true;
  }

  updatePlayer(id, updates) {
    Object.assign(this.players[id], updates);
  }
}
