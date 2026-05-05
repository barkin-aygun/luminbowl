import { getReachableCells, getOpponentTackleZones, dodgeTarget } from '../SkillChecks.js';

export function getReachableForActivation(playerId, turnState, players) {
  const act = turnState.activations[String(playerId)];
  const player = players[playerId];
  return getReachableCells(player.col, player.row, act.maRemaining, players, playerId);
}

export function validateStep(playerId, toCol, toRow, turnState, players) {
  const reachable = getReachableForActivation(playerId, turnState, players);
  const key = `${toCol},${toRow}`;

  if (!reachable.has(key)) {
    return { ok: false, error: 'out_of_range' };
  }

  const occupied = players.find(p => p.id !== playerId && p.col === toCol && p.row === toRow);
  if (occupied) {
    return { ok: false, error: 'occupied' };
  }

  // Dodge required if player is currently in any opponent tackle zone
  const player = players[playerId];
  const opponentZones = getOpponentTackleZones(playerId, players);
  const currentKey = `${player.col},${player.row}`;

  if (opponentZones.has(currentKey)) {
    const target = dodgeTarget(player.stats.ag);
    return { ok: true, requiresDodge: true, dodgeTarget: target };
  }

  return { ok: true, requiresDodge: false };
}
