export class SelectionManager {
  constructor(pitchEl, pitchRenderer, gameState, dragManager, dispatch) {
    this.pitchEl = pitchEl;
    this.renderer = pitchRenderer;
    this.gameState = gameState;
    this.dragManager = dragManager;
    this.dispatch = dispatch || null;
    this.selectedPlayer = null;
    this._actionMenu = null; // set externally via setActionMenu()

    this._onClick = this._onClick.bind(this);
    this._onMouseOver = this._onMouseOver.bind(this);
    this._onMouseOut = this._onMouseOut.bind(this);
  }

  setActionMenu(actionMenu) {
    this._actionMenu = actionMenu;
  }

  attach() {
    this.pitchEl.addEventListener('click', this._onClick);
    this.pitchEl.addEventListener('mouseover', this._onMouseOver);
    this.pitchEl.addEventListener('mouseout', this._onMouseOut);
  }

  clearSelection() {
    if (this.selectedPlayer) this.selectedPlayer.classList.remove('selected');
    this.selectedPlayer = null;
    document.querySelectorAll('.cell.move-hover').forEach(c => c.classList.remove('move-hover'));
  }

  _hasPlayer(cell) {
    return cell && cell.querySelector('.player');
  }

  _onClick(e) {
    // Engine-aware mode
    if (this.dispatch) {
      if (this.dragManager.didDrag) {
        this.dragManager.didDrag = false;
        return;
      }

      // Board locked during dice rolls
      const ts = this.gameState.turnState;
      if (ts && ts.focus === 'dice') return;

      const cell = e.target.closest('.cell');
      if (!cell) return;
      const token = cell.querySelector('.player');

      if (token) {
        const playerId = parseInt(token.dataset.playerId);

        // If this player is already activating and has chosen move, clicking them again
        // shows the action menu (to end activation, end turn, etc.)
        if (ts.activatingPlayerId === playerId && this._actionMenu) {
          const rect = token.getBoundingClientRect();
          const player = this.gameState.players[playerId];
          this._actionMenu.show(player, rect, ts, this.dispatch);
          return;
        }

        // Try to activate
        try {
          this.dispatch({ type: 'ACTIVATE_PLAYER', playerId });
          // Show action menu after successful activation
          if (this._actionMenu) {
            // Re-read state after dispatch — gameState reference is updated by main.js
            const newTs = this.gameState.turnState;
            const rect = token.getBoundingClientRect();
            this._actionMenu.show(this.gameState.players[playerId], rect, newTs, this.dispatch);
          }
        } catch {
          // Silently ignore invalid activations (wrong team, etc.)
          // main.js dispatch() shows a toast for errors
        }
        return;
      }

      // Click on empty cell during move action
      if (ts && ts.activatingPlayerId !== null) {
        const act = ts.activations[String(ts.activatingPlayerId)];
        if (act?.currentAction === 'move') {
          const coords = this.renderer.getCellCoords(cell);
          this.dispatch({ type: 'REQUEST_MOVE_STEP', col: coords.col, row: coords.row });
        }
      }
      return;
    }

    // Legacy free-move mode (no engine)
    if (this.dragManager.didDrag) {
      this.dragManager.didDrag = false;
      return;
    }

    const cell = e.target.closest('.cell');
    if (!cell) return;
    const token = cell.querySelector('.player');

    if (this.selectedPlayer && !token) {
      const id = parseInt(this.selectedPlayer.dataset.playerId);
      const coords = this.renderer.getCellCoords(cell);
      cell.appendChild(this.selectedPlayer);
      this.gameState.movePlayer?.(id, coords.col, coords.row);
      this.clearSelection();
      return;
    }

    if (token) {
      if (token === this.selectedPlayer) {
        this.clearSelection();
      } else {
        this.clearSelection();
        this.selectedPlayer = token;
        token.classList.add('selected');
      }
      return;
    }

    this.clearSelection();
  }

  _onMouseOver(e) {
    // Engine mode: only hover cells in reachable set during move
    if (this.dispatch) {
      const ts = this.gameState.turnState;
      if (!ts || ts.focus === 'dice') return;
      if (ts.activatingPlayerId === null) return;
      const act = ts.activations[String(ts.activatingPlayerId)];
      if (act?.currentAction !== 'move') return;
      const cell = e.target.closest('.cell');
      if (!cell || this._hasPlayer(cell)) return;
      if (cell.classList.contains('reachable')) cell.classList.add('move-hover');
      return;
    }

    if (!this.selectedPlayer) return;
    const cell = e.target.closest('.cell');
    if (!cell || this._hasPlayer(cell)) return;
    cell.classList.add('move-hover');
  }

  _onMouseOut(e) {
    const cell = e.target.closest('.cell');
    if (cell) cell.classList.remove('move-hover');
  }
}
