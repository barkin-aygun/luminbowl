import { TestRunner, assert } from './TestRunner.js';
import { GameState } from '../state/GameState.js';
import { reduce } from '../engine/reduce.js';
import { getReachableCells, getOpponentTackleZones } from '../engine/SkillChecks.js';
import { getReachableForActivation } from '../engine/actions/MoveAction.js';

export function registerMovementTests(runner) {
  runner.describe('SkillChecks.getReachableCells', () => {
    runner.it('returns empty set when maRemaining is 0', () => {
      const players = [];
      const cells = getReachableCells(8, 13, 0, players, -1);
      assert.equal(cells.size, 0);
    });

    runner.it('MA=1 from center reaches 8 adjacent cells on open field', () => {
      const players = [];
      const cells = getReachableCells(8, 13, 1, players, -1);
      assert.equal(cells.size, 8);
    });

    runner.it('diagonal step costs 1 (same as orthogonal)', () => {
      const players = [];
      // MA=1 should reach all 8 neighbors including diagonals
      const cells = getReachableCells(8, 13, 1, players, -1);
      assert.ok(cells.has('7,12'), 'diagonal NW reachable');
      assert.ok(cells.has('9,14'), 'diagonal SE reachable');
    });

    runner.it('blocked by other player', () => {
      const players = [
        { id: 0, team: 'red', col: 8, row: 13, stats: { ma: 6, st: 3, ag: 3, av: 8 }, status: 'active' },
        { id: 1, team: 'blue', col: 9, row: 13, stats: { ma: 6, st: 3, ag: 3, av: 8 }, status: 'active' },
      ];
      const cells = getReachableCells(8, 13, 1, players, 0);
      assert.ok(!cells.has('9,13'), 'blocked cell not reachable');
    });

    runner.it('active player cell is not treated as blocker', () => {
      const players = [
        { id: 0, team: 'red', col: 8, row: 13, stats: { ma: 6, st: 3, ag: 3, av: 8 }, status: 'active' },
      ];
      // Player 0 can reach all 8 neighbors (their own cell excluded from start, not blocked)
      const cells = getReachableCells(8, 13, 1, players, 0);
      assert.equal(cells.size, 8);
    });
  });

  runner.describe('getOpponentTackleZones', () => {
    runner.it('returns zones of all opponents', () => {
      const players = [
        { id: 0, team: 'red',  col: 8, row: 13, stats: { ma: 6, st: 3, ag: 3, av: 8 }, status: 'active' },
        { id: 1, team: 'blue', col: 8, row: 14, stats: { ma: 6, st: 3, ag: 3, av: 8 }, status: 'active' },
      ];
      const zones = getOpponentTackleZones(0, players);
      // Blue player at 8,14 threatens 7,13 / 8,13 / 9,13 / 7,14 / 9,14 / 7,15 / 8,15 / 9,15
      assert.ok(zones.has('8,13'), 'active player cell in opponent TZ');
      assert.ok(zones.has('7,13'));
    });
  });

  runner.describe('Move action via reducer', () => {
    function startedMoveState() {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 }); // red player 0
      s = reduce(s, { type: 'CHOOSE_ACTION', action: 'move' });
      return s;
    }

    runner.it('REQUEST_MOVE_STEP decrements maRemaining', () => {
      let s = startedMoveState();
      const startMA = s.turnState.activations['0'].maRemaining;
      const player = s.players[0];
      // Move one step right (should be safe — no opponents adjacent)
      s = reduce(s, { type: 'REQUEST_MOVE_STEP', col: player.col + 1, row: player.row });
      assert.equal(s.turnState.activations['0'].maRemaining, startMA - 1);
    });

    runner.it('player position updates after step', () => {
      let s = startedMoveState();
      const { col, row } = s.players[0];
      s = reduce(s, { type: 'REQUEST_MOVE_STEP', col: col + 1, row });
      assert.equal(s.players[0].col, col + 1);
      assert.equal(s.players[0].row, row);
    });

    runner.it('REQUEST_MOVE_STEP out of range throws', () => {
      let s = startedMoveState();
      assert.throws(() => reduce(s, { type: 'REQUEST_MOVE_STEP', col: 1, row: 1 }), 'out_of_range');
    });

    runner.it('REQUEST_MOVE_STEP while focus=dice throws', () => {
      let s = startedMoveState();
      // Manually craft a state where focus=dice (simulate by using a blue player adjacent)
      // Place blue player next to red player 0
      s = reduce(s, { type: 'UPDATE_PLAYER', playerId: 11,
        updates: { col: s.players[0].col + 1, row: s.players[0].row } });
      // Now moving anywhere from current pos requires dodge since blue is adjacent
      // Try to step to a non-adjacent cell — out_of_range. Step adjacent to trigger dodge.
      const { col, row } = s.players[0];
      // Step diagonally away from the blue player
      const target = reduce(s, { type: 'REQUEST_MOVE_STEP', col: col - 1, row });
      assert.equal(target.turnState.focus, 'dice');
    });

    runner.it('RESOLVE_ROLL pass commits step', () => {
      let s = startedMoveState();
      // Place blue player adjacent to trigger dodge
      s = reduce(s, { type: 'UPDATE_PLAYER', playerId: 11,
        updates: { col: s.players[0].col + 1, row: s.players[0].row } });
      const { col, row } = s.players[0];
      s = reduce(s, { type: 'REQUEST_MOVE_STEP', col: col - 1, row });
      assert.equal(s.turnState.focus, 'dice');
      const target = s.turnState.pendingRoll.target;
      s = reduce(s, { type: 'RESOLVE_ROLL', value: target });
      assert.equal(s.turnState.focus, 'board');
      assert.equal(s.players[0].col, col - 1);
    });

    runner.it('RESOLVE_ROLL fail stuns player and reverts position', () => {
      let s = startedMoveState();
      s = reduce(s, { type: 'UPDATE_PLAYER', playerId: 11,
        updates: { col: s.players[0].col + 1, row: s.players[0].row } });
      const origCol = s.players[0].col;
      const { col, row } = s.players[0];
      s = reduce(s, { type: 'REQUEST_MOVE_STEP', col: col - 1, row });
      const target = s.turnState.pendingRoll.target;
      s = reduce(s, { type: 'RESOLVE_ROLL', value: target - 1 });
      assert.equal(s.players[0].status, 'stunned');
      assert.equal(s.players[0].col, origCol);
      assert.equal(s.turnState.focus, 'board');
      assert.equal(s.turnState.activatingPlayerId, null);
    });

    runner.it('RESOLVE_ROLL when focus=board throws', () => {
      const s = GameState.createDefault();
      assert.throws(() => reduce(s, { type: 'RESOLVE_ROLL', value: 4 }), 'no pending roll');
    });
  });
}
