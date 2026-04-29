import { OUTLINE_COLORS } from '../pitch/constants.js';

export class SettingsModal {
  constructor(overlayEl, gameState, { onClose }) {
    this.overlayEl = overlayEl;
    this.gameState = gameState;
    this.onCloseCallback = onClose;

    document.getElementById('modalClose').addEventListener('click', () => this.close());
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.close();
    });
  }

  open() {
    this._buildRows();
    this.overlayEl.classList.add('open');
  }

  close() {
    this.overlayEl.classList.remove('open');
    if (this.onCloseCallback) this.onCloseCallback();
  }

  _buildRows() {
    const redList = document.getElementById('redTeamList');
    const blueList = document.getElementById('blueTeamList');
    redList.innerHTML = '';
    blueList.innerHTML = '';

    this.gameState.players.forEach(p => {
      const row = document.createElement('div');
      row.className = 'player-row';

      const label = document.createElement('label');
      label.textContent = '#';

      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.min = 0;
      numInput.max = 99;
      numInput.value = p.number;
      numInput.addEventListener('change', () => {
        this.gameState.updatePlayer(p.id, { number: parseInt(numInput.value) || 0 });
      });

      const swatchGroup = document.createElement('div');
      swatchGroup.className = 'swatch-group';

      OUTLINE_COLORS.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        if (color === p.outlineColor) swatch.classList.add('selected');
        swatch.style.background = color;
        swatch.addEventListener('click', () => {
          swatchGroup.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
          swatch.classList.add('selected');
          this.gameState.updatePlayer(p.id, { outlineColor: color });
        });
        swatchGroup.appendChild(swatch);
      });

      const rowTop = document.createElement('div');
      rowTop.className = 'row-top';
      rowTop.append(label, numInput, swatchGroup);

      const notesInput = document.createElement('textarea');
      notesInput.placeholder = 'Notes...';
      notesInput.value = p.notes;
      notesInput.addEventListener('input', () => {
        this.gameState.updatePlayer(p.id, { notes: notesInput.value });
      });

      row.append(rowTop, notesInput);
      (p.team === 'red' ? redList : blueList).appendChild(row);
    });
  }
}
