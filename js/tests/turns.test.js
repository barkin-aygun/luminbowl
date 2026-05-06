import { TestRunner, assert } from './TestRunner.js';
import { GameState } from '../state/GameState.js';
import { reduce } from '../engine/reduce.js';

export function registerTurnTests(runner) {
  runner.describe('START_GAME', () => {
    runner.it('transitions phase to drive', () => {
      const s = GameState.createDefault();
      const s2 = reduce(s, { type: 'START_GAME' });
      assert.equal(s2.turnState.phase, 'drive');
    });

    runner.it('throws if already started', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      assert.throws(() => reduce(s, { type: 'START_GAME' }), 'already started');
    });
  });

  runner.describe('ACTIVATE_PLAYER', () => {
    runner.it('throws when activating wrong-team player', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      // Player 11 is blue; red's turn
      assert.throws(() => reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 11 }), 'wrong team');
    });

    runner.it('throws when player already activated', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 });
      s = reduce(s, { type: 'END_ACTIVATION' });
      assert.throws(() => reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 }), 'already activated');
    });

    runner.it('throws when another player is already activating', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 });
      assert.throws(() => reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 1 }), 'already activating');
    });

    runner.it('sets activatingPlayerId', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 });
      assert.equal(s.turnState.activatingPlayerId, 0);
    });
  });

  runner.describe('END_TURN', () => {
    runner.it('flips activeCoach from red to blue', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'END_TURN' });
      assert.equal(s.turnState.activeCoach, 'blue');
    });

    runner.it('flips activeCoach from blue back to red', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'END_TURN' }); // blue's turn
      s = reduce(s, { type: 'END_TURN' }); // red's turn
      assert.equal(s.turnState.activeCoach, 'red');
    });

    runner.it('increments turnNumber after blue ends', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      assert.equal(s.turnState.turnNumber, 1);
      s = reduce(s, { type: 'END_TURN' }); // red done, blue starts (still turn 1)
      assert.equal(s.turnState.turnNumber, 1);
      s = reduce(s, { type: 'END_TURN' }); // blue done, red starts turn 2
      assert.equal(s.turnState.turnNumber, 2);
    });

    runner.it('resets all activations on end turn', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 });
      s = reduce(s, { type: 'END_ACTIVATION' });
      assert.ok(s.turnState.activations['0'].activated, 'activated before end turn');
      s = reduce(s, { type: 'END_TURN' });
      // After turn end, all activations reset (now blue's turn — check blue player)
      assert.ok(!s.turnState.activations['11'].activated, 'blue activation reset');
      // Red player activation should also be reset
      assert.ok(!s.turnState.activations['0'].activated, 'red activation reset');
    });

    runner.it('resets maRemaining to stats.ma on end turn', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 });
      s = reduce(s, { type: 'CHOOSE_ACTION', action: 'move' });
      const { col, row } = s.players[0];
      s = reduce(s, { type: 'REQUEST_MOVE_STEP', col: col + 1, row });
      assert.equal(s.turnState.activations['0'].maRemaining, s.players[0].stats.ma - 1);
      s = reduce(s, { type: 'END_TURN' });
      s = reduce(s, { type: 'END_TURN' }); // back to red
      assert.equal(s.turnState.activations['0'].maRemaining, s.players[0].stats.ma);
    });

    runner.it('clears activatingPlayerId on end turn', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 });
      s = reduce(s, { type: 'END_TURN' });
      assert.equal(s.turnState.activatingPlayerId, null);
    });

    runner.it('REQUEST_MOVE_STEP while focus=dice throws', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'ACTIVATE_PLAYER', playerId: 0 });
      s = reduce(s, { type: 'CHOOSE_ACTION', action: 'move' });
      // Manually set focus to dice via a blue player adjacent
      s = reduce(s, { type: 'UPDATE_PLAYER', playerId: 11,
        updates: { col: s.players[0].col + 1, row: s.players[0].row } });
      const { col, row } = s.players[0];
      s = reduce(s, { type: 'REQUEST_MOVE_STEP', col: col - 1, row });
      assert.equal(s.turnState.focus, 'dice');
      assert.throws(
        () => reduce(s, { type: 'REQUEST_MOVE_STEP', col: col - 2, row }),
        'dice roll pending'
      );
    });

    runner.it('halftime after 8 full rounds in half 1', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      // 8 red + 8 blue = 8 full rounds
      for (let i = 0; i < 8; i++) {
        s = reduce(s, { type: 'END_TURN' }); // red done
        s = reduce(s, { type: 'END_TURN' }); // blue done → increment
      }
      assert.equal(s.turnState.phase, 'halftime');
      assert.equal(s.turnState.half, 2);
      assert.equal(s.turnState.turnNumber, 1);
    });

    runner.it('game ends after 8 full rounds in half 2', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      // Complete half 1 (8 full rounds)
      for (let i = 0; i < 8; i++) {
        s = reduce(s, { type: 'END_TURN' });
        s = reduce(s, { type: 'END_TURN' });
      }
      assert.equal(s.turnState.phase, 'halftime');
      // Acknowledge halftime (1 END_TURN) then 8 full rounds for half 2
      s = reduce(s, { type: 'END_TURN' }); // halftime → drive, blue's turn
      for (let i = 0; i < 8; i++) {
        s = reduce(s, { type: 'END_TURN' });
        s = reduce(s, { type: 'END_TURN' });
      }
      assert.equal(s.turnState.phase, 'end');
    });
  });

  runner.describe('UPDATE_PLAYER', () => {
    runner.it('updates player fields', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'UPDATE_PLAYER', playerId: 0, updates: { number: 99 } });
      assert.equal(s.players[0].number, 99);
    });

    runner.it('updating MA stat refreshes maRemaining for unused activation', () => {
      let s = GameState.createDefault();
      s = reduce(s, { type: 'START_GAME' });
      s = reduce(s, { type: 'UPDATE_PLAYER', playerId: 0, updates: { stats: { ma: 4, st: 3, ag: 3, av: 8 } } });
      assert.equal(s.turnState.activations['0'].maRemaining, 4);
    });
  });
}
