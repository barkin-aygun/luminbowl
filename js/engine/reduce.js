import { produce } from '../lib/immer.js';
import { buildActivations, nextTurn } from './TurnManager.js';
import { validateStep, getReachableForActivation } from './actions/MoveAction.js';

export function reduce(state, action) {
  return produce(state, draft => {
    const ts = draft.turnState;

    switch (action.type) {

      case 'START_GAME':
        if (ts.phase !== 'pregame') throw new Error('already started');
        ts.phase = 'drive';
        break;

      case 'ACTIVATE_PLAYER': {
        const { playerId } = action;
        const player = draft.players[playerId];
        if (ts.phase !== 'drive') throw new Error('not in drive phase');
        if (ts.focus === 'dice') throw new Error('dice roll pending');
        if (player.team !== ts.activeCoach) throw new Error('wrong team');
        if (ts.activatingPlayerId !== null) throw new Error('already activating another player');
        if (ts.activations[String(playerId)].activated) throw new Error('already activated');
        ts.activatingPlayerId = playerId;
        ts.activations[String(playerId)].startCol = player.col;
        ts.activations[String(playerId)].startRow = player.row;
        break;
      }

      case 'CHOOSE_ACTION': {
        const { action: chosen } = action;
        const pid = ts.activatingPlayerId;
        if (pid === null) throw new Error('no active player');
        if (chosen === 'end') {
          ts.activations[String(pid)].activated = true;
          ts.activatingPlayerId = null;
        } else if (chosen === 'move') {
          ts.activations[String(pid)].currentAction = 'move';
        } else {
          throw new Error(`action '${chosen}' not implemented`);
        }
        break;
      }

      case 'REQUEST_MOVE_STEP': {
        const { col, row } = action;
        const pid = ts.activatingPlayerId;
        if (pid === null) throw new Error('no active player');
        if (ts.focus === 'dice') throw new Error('dice roll pending');
        if (ts.activations[String(pid)].currentAction !== 'move') throw new Error('not in move action');

        const result = validateStep(pid, col, row, ts, draft.players);
        if (!result.ok) throw new Error(result.error);

        if (result.requiresDodge) {
          ts.focus = 'dice';
          ts.pendingRoll = {
            type: 'dodge',
            playerId: pid,
            toCol: col,
            toRow: row,
            target: result.dodgeTarget
          };
        } else {
          draft.players[pid].col = col;
          draft.players[pid].row = row;
          ts.activations[String(pid)].maRemaining -= 1;
          ts.pendingMovePath.push({ col, row });
        }
        break;
      }

      case 'RESOLVE_ROLL': {
        const { value } = action;
        if (ts.focus !== 'dice') throw new Error('no pending roll');
        const roll = ts.pendingRoll;
        ts.focus = 'board';
        ts.pendingRoll = null;

        if (roll.type === 'dodge') {
          if (value >= roll.target) {
            draft.players[roll.playerId].col = roll.toCol;
            draft.players[roll.playerId].row = roll.toRow;
            ts.activations[String(roll.playerId)].maRemaining -= 1;
            ts.pendingMovePath.push({ col: roll.toCol, row: roll.toRow });
          } else {
            draft.players[roll.playerId].status = 'stunned';
            const act = ts.activations[String(roll.playerId)];
            draft.players[roll.playerId].col = act.startCol;
            draft.players[roll.playerId].row = act.startRow;
            ts.pendingMovePath = [];
            act.activated = true;
            ts.activatingPlayerId = null;
          }
        } else {
          throw new Error(`unknown roll type: ${roll.type}`);
        }
        break;
      }

      case 'END_ACTIVATION': {
        const pid = ts.activatingPlayerId;
        if (pid === null) throw new Error('no active player');
        ts.activations[String(pid)].activated = true;
        ts.activatingPlayerId = null;
        ts.pendingMovePath = [];
        break;
      }

      case 'END_TURN': {
        // nextTurn returns a fresh plain object; assign each key onto draft
        const newTs = nextTurn(ts, draft.players);
        Object.assign(ts, newTs);
        break;
      }

      case 'UPDATE_PLAYER': {
        const { playerId, updates } = action;
        Object.assign(draft.players[playerId], updates);
        // If stats changed, rebuild maRemaining for this player's activation (if not yet used)
        if (updates.stats) {
          const act = ts.activations[String(playerId)];
          if (act && !act.activated && act.currentAction === null) {
            act.maRemaining = draft.players[playerId].stats.ma;
          }
        }
        break;
      }

      default:
        throw new Error(`unknown action: ${action.type}`);
    }
  });
}
