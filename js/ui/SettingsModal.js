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

      // Stat inputs: MA / ST / AG / AV
      const statsRow = document.createElement('div');
      statsRow.className = 'stats-row';
      const STAT_KEYS = ['ma', 'st', 'ag', 'av'];
      // Local mutable copy — avoids mutating Immer-frozen player objects
      const localStats = { ...(p.stats ?? { ma: 6, st: 3, ag: 3, av: 8 }) };
      STAT_KEYS.forEach(stat => {
        const statLabel = document.createElement('label');
        statLabel.className = 'stat-label';
        statLabel.textContent = stat.toUpperCase();

        const statInput = document.createElement('input');
        statInput.type = 'number';
        statInput.min = 1;
        statInput.max = 10;
        statInput.value = localStats[stat];
        statInput.className = 'stat-input';
        statInput.addEventListener('change', () => {
          const val = Math.min(10, Math.max(1, parseInt(statInput.value) || 1));
          statInput.value = val;
          localStats[stat] = val;
          this.gameState.updatePlayer(p.id, { stats: { ...localStats } });
        });

        const wrap = document.createElement('div');
        wrap.className = 'stat-wrap';
        wrap.append(statLabel, statInput);
        statsRow.appendChild(wrap);
      });

      const notesInput = document.createElement('textarea');
      notesInput.placeholder = 'Notes...';
      notesInput.value = p.notes;
      notesInput.addEventListener('input', () => {
        this.gameState.updatePlayer(p.id, { notes: notesInput.value });
      });

      row.append(rowTop, statsRow, notesInput);
      (p.team === 'red' ? redList : blueList).appendChild(row);
    });
  }
}
