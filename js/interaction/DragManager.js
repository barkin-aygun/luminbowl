export class DragManager {
  constructor(pitchEl, pitchRenderer, gameState, { onDragEnd }) {
    this.pitchEl = pitchEl;
    this.renderer = pitchRenderer;
    this.gameState = gameState;
    this.onDragEnd = onDragEnd;
    this.enabled = true;

    this.dragToken = null;
    this.dragOriginCell = null;
    this.lastSnapCell = null;
    this.distanceEl = null;
    this.didDrag = false;

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  isDragging() {
    return this.dragToken !== null;
  }

  setEnabled(bool) {
    this.enabled = bool;
  }

  attach() {
    this.pitchEl.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
  }

  detach() {
    this.pitchEl.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }

  _hasPlayer(cell) {
    return cell && cell.querySelector('.player');
  }

  _updateDistance() {
    if (!this.dragToken || !this.dragOriginCell || !this.distanceEl) return;
    const currentCell = this.dragToken.closest('.cell');
    if (!currentCell || currentCell === this.dragOriginCell) {
      this.distanceEl.textContent = '';
      return;
    }
    const dc = Math.abs(parseInt(currentCell.dataset.col) - parseInt(this.dragOriginCell.dataset.col));
    const dr = Math.abs(parseInt(currentCell.dataset.row) - parseInt(this.dragOriginCell.dataset.row));
    this.distanceEl.textContent = Math.max(dc, dr);
  }

  _onMouseDown(e) {
    if (!this.enabled) return;
    const token = e.target.closest('.player');
    if (!token) return;

    e.preventDefault();
    this.didDrag = false;
    this.dragToken = token;
    this.dragOriginCell = token.closest('.cell');
    this.dragToken.classList.add('dragging');
    this.lastSnapCell = this.dragOriginCell;

    // Hide tooltip
    const tooltip = document.getElementById('playerTooltip');
    if (tooltip) tooltip.classList.remove('visible');

    this.distanceEl = document.createElement('div');
    this.distanceEl.className = 'drag-distance';
    this.dragOriginCell.appendChild(this.distanceEl);
  }

  _onMouseMove(e) {
    if (!this.dragToken) return;
    this.didDrag = true;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const cell = el.closest('.cell');
    if (!cell) return;

    if (cell !== this.lastSnapCell) {
      if (!this._hasPlayer(cell) || cell === this.dragOriginCell) {
        cell.appendChild(this.dragToken);
        this.lastSnapCell = cell;
        this._updateDistance();
      }
    }
  }

  _onMouseUp() {
    if (!this.dragToken) return;

    const currentCell = this.dragToken.closest('.cell');

    // If dropped on occupied cell, return to origin
    if (currentCell !== this.dragOriginCell && this._hasPlayer(currentCell) && currentCell.querySelector('.player') !== this.dragToken) {
      this.dragOriginCell.appendChild(this.dragToken);
    } else if (currentCell !== this.dragOriginCell) {
      // Update game state
      const id = parseInt(this.dragToken.dataset.playerId);
      const coords = this.renderer.getCellCoords(currentCell);
      this.gameState.movePlayer(id, coords.col, coords.row);
    }

    if (this.distanceEl) { this.distanceEl.remove(); this.distanceEl = null; }
    this.dragToken.classList.remove('dragging');
    this.dragToken = null;
    this.dragOriginCell = null;
    this.lastSnapCell = null;

    if (this.onDragEnd) this.onDragEnd();
  }
}
