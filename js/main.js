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

const state = loadState() || GameState.createDefault();

const pitchEl = document.getElementById('pitch');
const renderer = new PitchRenderer(pitchEl, state);
renderer.buildGrid();
renderer.renderPlayers();

const canvasRenderer = new CanvasRenderer(pitchEl, state);

const drag = new DragManager(pitchEl, renderer, state, {
  onDragEnd: () => {} // DOM already moved, state updated in DragManager
});
const selection = new SelectionManager(pitchEl, renderer, state, drag);
const tooltip = new TooltipManager(document.getElementById('playerTooltip'), state, drag);
const modal = new SettingsModal(document.getElementById('modalOverlay'), state, {
  onClose: () => renderer.renderPlayers()
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
