export function buildActivations(players) {
  const activations = {};
  for (const p of players) {
    activations[String(p.id)] = {
      activated: false,
      maRemaining: p.stats.ma,
      currentAction: null,
      startCol: null,
      startRow: null
    };
  }
  return activations;
}

export function nextTurn(turnState, players) {
  const wasBlue = turnState.activeCoach === 'blue';
  const nextCoach = wasBlue ? 'red' : 'blue';
  let { turnNumber, half, phase } = turnState;

  // Halftime is acknowledged by the first END_TURN — resumes drive for half 2
  if (phase === 'halftime') {
    phase = 'drive';
  }

  if (wasBlue) {
    turnNumber += 1;
    if (turnNumber > 8) {
      if (half === 1) {
        half = 2;
        turnNumber = 1;
        phase = 'halftime';
      } else {
        phase = 'end';
        turnNumber = 8;
      }
    }
  }

  return {
    ...turnState,
    phase,
    half,
    turnNumber,
    activeCoach: nextCoach,
    activatingPlayerId: null,
    pendingMovePath: [],
    focus: 'board',
    pendingRoll: null,
    activations: buildActivations(players)
  };
}

export function isHalftime(turnState) {
  return turnState.phase === 'halftime';
}

export function isGameEnd(turnState) {
  return turnState.phase === 'end';
}
