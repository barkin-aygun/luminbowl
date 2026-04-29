import {
  GRID_COLS, GRID_ROWS,
  LEFT_COL_TOP, LEFT_COL_BOTTOM, RIGHT_COL_TOP, RIGHT_COL_BOTTOM
} from './constants.js';

export class PitchRenderer {
  constructor(pitchEl, gameState) {
    this.pitchEl = pitchEl;
    this.gameState = gameState;
    this.cells = {};
  }

  buildGrid() {
    for (let row = 1; row <= GRID_ROWS; row++) {
      for (let col = 1; col <= GRID_COLS; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.col = col;
        cell.dataset.row = row;
        this.cells[`${col},${row}`] = cell;

        if (row % 2 === 0) cell.classList.add('row-even');
        if (row === 1) cell.classList.add('endzone-top');
        else if (row === 26) cell.classList.add('endzone-bottom');
        if (col === 4) cell.classList.add('wide-edge-right');
        if (col === 5) cell.classList.add('wide-edge-left');
        if (col === 11) cell.classList.add('wide-edge-right');
        if (col === 12) cell.classList.add('wide-edge-left');
        if (row === 13) cell.classList.add('scrimmage-bottom');
        if (row === 14) cell.classList.add('scrimmage-top');
        if (col === 8 && (row === 7 || row === 20)) cell.classList.add('kick-target');

        let number = null;
        if (col === 1) number = LEFT_COL_TOP[row] || LEFT_COL_BOTTOM[row];
        else if (col === GRID_COLS) number = RIGHT_COL_TOP[row] || RIGHT_COL_BOTTOM[row];
        if (number != null) {
          cell.classList.add('numbered');
          cell.textContent = number;
        }

        this.pitchEl.appendChild(cell);
      }
    }
  }

  renderPlayers() {
    document.querySelectorAll('.player').forEach(el => el.remove());

    this.gameState.players.forEach(p => {
      const cell = this.cells[`${p.col},${p.row}`];
      if (!cell) return;
      const token = document.createElement('div');
      token.classList.add('player', `player-${p.team}`);
      token.dataset.playerId = p.id;
      token.style.border = `2px solid ${p.outlineColor}`;
      token.textContent = p.number;
      cell.appendChild(token);
    });
  }

  getCell(col, row) {
    return this.cells[`${col},${row}`] || null;
  }

  getCellCoords(cellEl) {
    return {
      col: parseInt(cellEl.dataset.col),
      row: parseInt(cellEl.dataset.row)
    };
  }
}
