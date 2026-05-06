import { GameState } from './state/GameState.js';
import { loadState, saveState } from './state/storage.js';
import { PitchRenderer } from './pitch/PitchRenderer.js';
import { CanvasRenderer } from './pitch/CanvasRenderer.js';
import { DragManager } from './interaction/DragManager.js';
import { SelectionManager } from './interaction/SelectionManager.js';
import { TooltipManager } from './interaction/TooltipManager.js';
import { showToast } from './ui/Toast.js';
import { SettingsModal } from './ui/SettingsModal.js';
import { addRandomSplatters } from './ui/BloodEffects.js';
import { DiceRoller } from './ui/DiceRoller.js';
import { TurnPanel } from './ui/TurnPanel.js';
import { ActionMenu } from './ui/ActionMenu.js';
import { reduce } from './engine/reduce.js';
import { getReachableForActivation } from './engine/actions/MoveAction.js';

// ?test branch
if (new URLSearchParams(location.search).has('test')) {
  document.getElementById('test-root').style.display = 'block';
  const { runAllTests } = await import('./tests/index.js');
  runAllTests(document.getElementById('test-root'));
}

let state = loadState() || GameState.createDefault();

// Live proxy — always reflects current state after each dispatch
const stateProxy = new Proxy({}, {
  get(_, key) {
    if (key === 'players') return state.players;
    if (key === 'turnState') return state.turnState;
    if (key === 'updatePlayer') {
      return (id, updates) => dispatch({ type: 'UPDATE_PLAYER', playerId: id, updates });
    }
    return undefined;
  }
});

const pitchEl = document.getElementById('pitch');
const renderer = new PitchRenderer(pitchEl, stateProxy);
renderer.buildGrid();

const canvasRenderer = new CanvasRenderer(pitchEl, stateProxy);

const drag = new DragManager(pitchEl, renderer, stateProxy, { onDragEnd: () => {} });
drag.setEnabled(false);

const turnPanel = new TurnPanel(document.getElementById('turn-panel'));
const actionMenu = new ActionMenu(document.getElementById('action-menu'));

function dispatch(action) {
  try {
    state = reduce(state, action);
  } catch (err) {
    showToast(err.message);
    return;
  }
  render();
  saveState(state);
}

function render() {
  const ts = state.turnState;
  renderer.renderPlayers(state);
  renderer.clearHighlights();

  if (
    ts.activatingPlayerId !== null &&
    ts.activations[String(ts.activatingPlayerId)]?.currentAction === 'move'
  ) {
    const cells = getReachableForActivation(ts.activatingPlayerId, ts, state.players);
    renderer.highlightReachable(cells);
  }

  turnPanel.render(ts, dispatch);

  if (ts.focus === 'dice' && ts.pendingRoll) {
    dice.setPendingRoll(ts.pendingRoll, value => dispatch({ type: 'RESOLVE_ROLL', value }));
    actionMenu.hide();
  } else {
    dice.setPendingRoll(null, null);
  }
}

const selection = new SelectionManager(pitchEl, renderer, stateProxy, drag, dispatch);
selection.setActionMenu(actionMenu);
const tooltip = new TooltipManager(document.getElementById('playerTooltip'), stateProxy, drag);
const modal = new SettingsModal(document.getElementById('modalOverlay'), stateProxy, {
  onClose: () => render()
});

drag.attach();
selection.attach();
tooltip.attach();

document.getElementById('settingsBtn').addEventListener('click', () => modal.open());
document.getElementById('saveBtn').addEventListener('click', () => {
  saveState(state);
  showToast('State saved');
});
document.getElementById('screenshotBtn').addEventListener('click', () => canvasRenderer.captureToClipboard());
document.getElementById('bloodBtn').addEventListener('click', () => addRandomSplatters(renderer));

const dice = new DiceRoller();
dice.attach(document.getElementById('topLeftButtons'));

// Restore dice context if page was reloaded mid-roll
render();
