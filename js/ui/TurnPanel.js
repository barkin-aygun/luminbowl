export class TurnPanel {
  constructor(el) {
    this.el = el;
  }

  render(turnState, dispatch) {
    this.el.innerHTML = '';

    if (turnState.phase === 'pregame') {
      this.el.style.setProperty('--coach-color', '#888');
      const label = document.createElement('div');
      label.className = 'turn-panel-phase';
      label.textContent = 'Pre-Game';
      this.el.appendChild(label);

      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.textContent = 'Start Game';
      btn.addEventListener('click', () => dispatch({ type: 'START_GAME' }));
      this.el.appendChild(btn);
      return;
    }

    if (turnState.phase === 'end') {
      this.el.style.setProperty('--coach-color', '#888');
      const label = document.createElement('div');
      label.className = 'turn-panel-phase';
      label.textContent = 'Game Over';
      this.el.appendChild(label);
      return;
    }

    const coachColor = turnState.activeCoach === 'red' ? '#e03030' : '#2060e0';
    this.el.style.setProperty('--coach-color', coachColor);

    const phaseLabel = turnState.phase === 'halftime' ? 'Half Time' : `Half ${turnState.half}`;

    const coach = document.createElement('div');
    coach.className = 'turn-panel-coach';
    coach.textContent = turnState.activeCoach === 'red' ? 'Red' : 'Blue';
    coach.style.color = coachColor;
    this.el.appendChild(coach);

    const turn = document.createElement('div');
    turn.className = 'turn-panel-turn';
    turn.textContent = `Turn ${turnState.turnNumber} · ${phaseLabel}`;
    this.el.appendChild(turn);

    const activatedCount = Object.values(turnState.activations).filter(a => {
      return a.activated;
    }).length;
    // Count only current coach's activations
    const coachActivated = Object.entries(turnState.activations)
      .filter(([, a]) => a.activated).length;
    // We don't have team info here — just show total activated for readability
    const acts = document.createElement('div');
    acts.className = 'turn-panel-activations';
    acts.textContent = `${coachActivated}/22 activated`;
    this.el.appendChild(acts);

    if (turnState.phase === 'halftime') {
      const htMsg = document.createElement('div');
      htMsg.className = 'turn-panel-phase';
      htMsg.textContent = 'Half Time — flip the board!';
      this.el.appendChild(htMsg);

      const htBtn = document.createElement('button');
      htBtn.className = 'action-btn';
      htBtn.textContent = 'Start Half 2';
      htBtn.addEventListener('click', () => dispatch({ type: 'END_TURN' }));
      this.el.appendChild(htBtn);
    }
  }
}
