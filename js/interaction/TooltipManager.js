export class TooltipManager {
  constructor(tooltipEl, gameState, dragManager) {
    this.tooltipEl = tooltipEl;
    this.gameState = gameState;
    this.dragManager = dragManager;
    this.timer = null;

    this._onMouseOver = this._onMouseOver.bind(this);
    this._onMouseOut = this._onMouseOut.bind(this);
  }

  attach() {
    document.addEventListener('mouseover', this._onMouseOver);
    document.addEventListener('mouseout', this._onMouseOut);
  }

  _onMouseOver(e) {
    const token = e.target.closest('.player');
    if (!token || this.dragManager.isDragging()) return;
    const pid = parseInt(token.dataset.playerId);
    const p = this.gameState.players[pid];
    if (!p.notes) return;

    clearTimeout(this.timer);
    this.tooltipEl.innerHTML = '';
    this.tooltipEl.appendChild(document.createTextNode(p.notes));

    const rect = token.getBoundingClientRect();
    const tipRight = rect.right + 8;
    const tipLeft = rect.left;

    this.tooltipEl.style.top = rect.top + 'px';
    if (tipRight + 230 < window.innerWidth) {
      this.tooltipEl.style.left = tipRight + 'px';
      this.tooltipEl.style.right = '';
    } else {
      this.tooltipEl.style.left = '';
      this.tooltipEl.style.right = (window.innerWidth - tipLeft + 8) + 'px';
    }

    this.tooltipEl.classList.add('visible');
  }

  _onMouseOut(e) {
    const token = e.target.closest('.player');
    if (!token) return;
    this.timer = setTimeout(() => this.tooltipEl.classList.remove('visible'), 100);
  }
}
