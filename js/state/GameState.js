import { RED_POSITIONS, BLUE_POSITIONS, DEFAULT_STATS } from '../pitch/constants.js';

export class GameState {
  static createDefault() {
    const players = [];
    for (let i = 0; i < 11; i++) {
      players.push({
        id: i, team: 'red', number: i + 1, outlineColor: 'white', notes: '',
        col: RED_POSITIONS[i][0], row: RED_POSITIONS[i][1],
        stats: { ...DEFAULT_STATS }, status: 'active'
      });
    }
    for (let i = 0; i < 11; i++) {
      players.push({
        id: i + 11, team: 'blue', number: i + 1, outlineColor: 'white', notes: '',
        col: BLUE_POSITIONS[i][0], row: BLUE_POSITIONS[i][1],
        stats: { ...DEFAULT_STATS }, status: 'active'
      });
    }
    return { players, turnState: GameState._initTurnState(players) };
  }

  static _initTurnState(players) {
    const activations = {};
    players.forEach(p => {
      activations[String(p.id)] = {
        activated: false,
        maRemaining: p.stats.ma,
        currentAction: null,
        startCol: null,
        startRow: null
      };
    });
    return {
      phase: 'pregame',
      half: 1,
      turnNumber: 1,
      activeCoach: 'red',
      activatingPlayerId: null,
      pendingMovePath: [],
      focus: 'board',
      pendingRoll: null,
      activations
    };
  }

  static fromJSON(data) {
    const raw = typeof data === 'string' ? JSON.parse(data) : data;
    const players = Array.isArray(raw) ? raw : raw.players;
    if (!players || players.length !== 22) return null;
    const normalized = players.map(p => ({
      ...p,
      stats: p.stats ?? { ...DEFAULT_STATS },
      status: p.status ?? 'active'
    }));
    const turnState = raw.turnState ?? GameState._initTurnState(normalized);
    return { players: normalized, turnState };
  }

  static toJSON(state) {
    return { players: state.players, turnState: state.turnState };
  }
}
