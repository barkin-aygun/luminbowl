export class SelectionManager {
  constructor(pitchEl, pitchRenderer, gameState, dragManager) {
    this.pitchEl = pitchEl;
    this.renderer = pitchRenderer;
    this.gameState = gameState;
    this.dragManager = dragManager;
    this.selectedPlayer = null;

    this._onClick = this._onClick.bind(this);
    this._onMouseOver = this._onMouseOver.bind(this);
    this._onMouseOut = this._onMouseOut.bind(this);
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
    if (this.dragManager.didDrag) {
      this.dragManager.didDrag = false;
      return;
    }

    const cell = e.target.closest('.cell');
    if (!cell) return;

    const token = cell.querySelector('.player');

    // Clicking an empty cell while a player is selected: move there
    if (this.selectedPlayer && !token) {
      const id = parseInt(this.selectedPlayer.dataset.playerId);
      const coords = this.renderer.getCellCoords(cell);
      cell.appendChild(this.selectedPlayer);
      this.gameState.movePlayer(id, coords.col, coords.row);
      this.clearSelection();
      return;
    }

    // Clicking a player: select/deselect
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
