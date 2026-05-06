export class ActionMenu {
  constructor(el) {
    this.el = el;
    this._dispatch = null;
    this._playerId = null;
  }

  show(player, anchorRect, turnState, dispatch) {
    this._dispatch = dispatch;
    this._playerId = player.id;

    this.el.innerHTML = '';

    const activation = turnState.activations[String(player.id)];
    const isMidMove = activation?.currentAction === 'move';
    const isActivating = turnState.activatingPlayerId === player.id;

    const ACTIONS = [
      { name: 'Move',       action: 'move',     stub: false, show: !isMidMove },
      { name: 'Block',      action: 'block',    stub: true,  show: true },
      { name: 'Blitz',      action: 'blitz',    stub: true,  show: true },
      { name: 'Pass',       action: 'pass',     stub: true,  show: true },
      { name: 'Hand Off',   action: 'handoff',  stub: true,  show: true },
      { name: 'Foul',       action: 'foul',     stub: true,  show: true },
    ];

    ACTIONS.forEach(({ name, action, stub, show }) => {
      if (!show) return;
      const btn = document.createElement('button');
      btn.className = 'action-btn' + (stub ? ' stub' : '');
      btn.textContent = name;
      if (!stub) {
        btn.addEventListener('click', () => {
          this.hide();
          dispatch({ type: 'CHOOSE_ACTION', action });
        });
      }
      this.el.appendChild(btn);
    });

    if (isActivating) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:rgba(255,255,255,0.1);margin:4px 0';
      this.el.appendChild(sep);

      const endAct = document.createElement('button');
      endAct.className = 'action-btn';
      endAct.textContent = 'End Activation';
      endAct.addEventListener('click', () => {
        this.hide();
        dispatch({ type: 'END_ACTIVATION' });
      });
      this.el.appendChild(endAct);
    }

    const sep2 = document.createElement('div');
    sep2.style.cssText = 'height:1px;background:rgba(255,255,255,0.1);margin:4px 0';
    this.el.appendChild(sep2);

    const endTurn = document.createElement('button');
    endTurn.className = 'action-btn';
    endTurn.textContent = 'End Turn';
    endTurn.addEventListener('click', () => {
      this.hide();
      dispatch({ type: 'END_TURN' });
    });
    this.el.appendChild(endTurn);

    // Position near the player token
    const menuW = 150;
    const menuH = this.el.scrollHeight || 200;
    let left = anchorRect.right + 4;
    let top = anchorRect.top;

    if (left + menuW > window.innerWidth) left = anchorRect.left - menuW - 4;
    if (top + menuH > window.innerHeight) top = window.innerHeight - menuH - 8;
    top = Math.max(8, top);

    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
    this.el.style.display = 'flex';
  }

  hide() {
    this.el.style.display = 'none';
    this._dispatch = null;
    this._playerId = null;
  }
}
