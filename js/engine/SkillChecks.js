import { GRID_COLS, GRID_ROWS } from '../pitch/constants.js';

export function getReachableCells(startCol, startRow, maRemaining, players, activePlayerId) {
  const occupied = new Set();
  for (const p of players) {
    if (p.id !== activePlayerId) occupied.add(`${p.col},${p.row}`);
  }

  const reachable = new Set();
  // BFS: each entry is [col, row, maLeft]
  const queue = [[startCol, startRow, maRemaining]];
  const visited = new Map(); // key -> best maLeft seen

  visited.set(`${startCol},${startRow}`, maRemaining);

  while (queue.length > 0) {
    const [col, row, ma] = queue.shift();
    if (ma === 0) continue;

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 1 || nc > GRID_COLS || nr < 1 || nr > GRID_ROWS) continue;
        const key = `${nc},${nr}`;
        if (occupied.has(key)) continue;
        const remaining = ma - 1;
        if ((visited.get(key) ?? -1) < remaining) {
          visited.set(key, remaining);
          reachable.add(key);
          if (remaining > 0) queue.push([nc, nr, remaining]);
        }
      }
    }
  }

  return reachable;
}

export function getOpponentTackleZones(playerId, players) {
  const player = players[playerId];
  const opponentTeam = player.team === 'red' ? 'blue' : 'red';
  const zones = new Set();

  for (const p of players) {
    if (p.team !== opponentTeam) continue;
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const nc = p.col + dc;
        const nr = p.row + dr;
        if (nc >= 1 && nc <= GRID_COLS && nr >= 1 && nr <= GRID_ROWS) {
          zones.add(`${nc},${nr}`);
        }
      }
    }
  }

  return zones;
}

export function dodgeTarget(agility) {
  return Math.max(2, 4 - agility + 1);
}
