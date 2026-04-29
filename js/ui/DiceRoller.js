const D6_PIPS = {
  1: [[1,1]],
  2: [[2,0],[0,2]],
  3: [[2,0],[1,1],[0,2]],
  4: [[0,0],[2,0],[0,2],[2,2]],
  5: [[0,0],[2,0],[1,1],[0,2],[2,2]],
  6: [[0,0],[2,0],[0,1],[2,1],[0,2],[2,2]],
};
const PX = ['15%','50%','85%'];
const PY = ['15%','50%','85%'];

const BB_FACES = [
  { p: '→', s: null },
  { p: '→', s: null },
  { p: '☠', s: null },
  { p: '✸', s: null },
  { p: '☠', s: '✸'  },
  { p: '!', s: '✸'  },
];

function renderD6(el, value) {
  el.querySelectorAll('.pip').forEach(n => n.remove());
  (D6_PIPS[value] || []).forEach(([c, r]) => {
    const p = document.createElement('div');
    p.className = 'pip';
    p.style.left = PX[c];
    p.style.top = PY[r];
    el.appendChild(p);
  });
}

function renderBB(el, faceIdx) {
  el.querySelectorAll('.bb-sym').forEach(n => n.remove());
  const face = BB_FACES[faceIdx];
  if (!face) return;
  const mk = (cls, text) => {
    const s = document.createElement('span');
    s.className = 'bb-sym ' + cls;
    s.textContent = text;
    el.appendChild(s);
  };
  mk('bb-primary', face.p);
  if (face.s) mk('bb-secondary', face.s);
}

function renderNumeric(el, value) {
  el.querySelectorAll('.die-num').forEach(n => n.remove());
  const s = document.createElement('span');
  s.className = 'die-num';
  s.textContent = value;
  el.appendChild(s);
}

const SECTIONS = [
  {
    type: 'd6',  label: 'D6',    max: 3, dieClass: 'dice-option-d6',
    init: el => renderD6(el, 6),
    roll: () => ({ type: 'd6',  value: Math.floor(Math.random() * 6)  + 1 }),
  },
  {
    type: 'd8',  label: 'D8',    max: 1, dieClass: 'dice-option-d8',
    init: el => renderNumeric(el, 8),
    roll: () => ({ type: 'd8',  value: Math.floor(Math.random() * 8)  + 1 }),
  },
  {
    type: 'd16', label: 'D16',   max: 1, dieClass: 'dice-option-d16',
    init: el => renderNumeric(el, 16),
    roll: () => ({ type: 'd16', value: Math.floor(Math.random() * 16) + 1 }),
  },
  {
    type: 'bb',  label: 'Block', max: 3, dieClass: 'dice-option-bb',
    init: el => renderBB(el, 3),
    roll: () => ({ type: 'bb',  face:  Math.floor(Math.random() * 6) }),
  },
];

export class DiceRoller {
  constructor() {
    this._counts  = Object.fromEntries(SECTIONS.map(s => [s.type, 0]));
    this._diceEls = {};
    this._buildPanel();
    this._buildOverlay();
  }

  attach(btnContainer) {
    btnContainer.appendChild(this.btn);
    document.body.appendChild(this.panel);
    document.body.appendChild(this.overlay);
  }

  _buildPanel() {
    this.btn = document.createElement('button');
    this.btn.className = 'top-btn';
    this.btn.title = 'Roll dice';
    this.btn.innerHTML = '&#127922;';
    this.btn.addEventListener('click', e => {
      e.stopPropagation();
      this.panel.classList.toggle('open');
    });

    this.panel = document.createElement('div');
    this.panel.className = 'dice-panel';

    const title = document.createElement('div');
    title.className = 'dice-panel-title';
    title.textContent = 'Roll Dice';
    this.panel.appendChild(title);

    SECTIONS.forEach(sec => this.panel.appendChild(this._buildSection(sec)));

    const sep = document.createElement('div');
    sep.className = 'dice-separator';
    this.panel.appendChild(sep);

    const combo = document.createElement('button');
    combo.className = 'dice-combo-btn';
    combo.textContent = 'D6 + D8';
    combo.addEventListener('click', e => {
      e.stopPropagation();
      this.panel.classList.remove('open');
      this._showResults([
        SECTIONS.find(s => s.type === 'd6').roll(),
        SECTIONS.find(s => s.type === 'd8').roll(),
      ]);
    });
    this.panel.appendChild(combo);

    this.rollBtn = document.createElement('button');
    this.rollBtn.className = 'dice-roll-btn';
    this.rollBtn.textContent = 'Roll';
    this.rollBtn.disabled = true;
    this.rollBtn.addEventListener('click', e => {
      e.stopPropagation();
      this._roll();
    });
    this.panel.appendChild(this.rollBtn);

    document.addEventListener('click', e => {
      if (!this.panel.contains(e.target) && e.target !== this.btn) {
        this.panel.classList.remove('open');
      }
    });
  }

  _buildSection(sec) {
    const section = document.createElement('div');
    section.className = 'dice-section';

    const lbl = document.createElement('div');
    lbl.className = 'dice-section-label';
    lbl.textContent = sec.label;
    section.appendChild(lbl);

    const row = document.createElement('div');
    row.className = 'dice-section-row';
    const els = [];

    for (let i = 0; i < sec.max; i++) {
      const die = document.createElement('div');
      die.className = `dice-option ${sec.dieClass}`;
      sec.init(die);
      const idx = i;
      die.addEventListener('click', () => this._clickDie(sec.type, idx));
      els.push(die);
      row.appendChild(die);
    }

    this._diceEls[sec.type] = els;
    section.appendChild(row);
    return section;
  }

  _buildOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'dice-roll-overlay';

    this.rollContainer = document.createElement('div');
    this.rollContainer.className = 'dice-roll-container';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'dice-accept-btn';
    acceptBtn.textContent = 'Accept';
    acceptBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.overlay.classList.remove('open');
    });

    this.overlay.appendChild(this.rollContainer);
    this.overlay.appendChild(acceptBtn);
  }

  // Click die at index: set count to index+1, or 0 if already at that level
  _clickDie(type, index) {
    this._counts[type] = this._counts[type] === index + 1 ? 0 : index + 1;
    this._updateHighlight(type);
    this._updateRollBtn();
  }

  _updateHighlight(type) {
    const count = this._counts[type];
    (this._diceEls[type] || []).forEach((el, i) => {
      el.classList.toggle('selected', i < count);
    });
  }

  _updateRollBtn() {
    const total = Object.values(this._counts).reduce((a, b) => a + b, 0);
    this.rollBtn.disabled = total === 0;
  }

  _roll() {
    const results = [];
    SECTIONS.forEach(sec => {
      for (let i = 0; i < this._counts[sec.type]; i++) results.push(sec.roll());
    });
    if (results.length === 0) return;
    this.panel.classList.remove('open');
    this._showResults(results);
  }

  _showResults(results) {
    this.rollContainer.innerHTML = '';
    results.forEach(r => {
      const die = document.createElement('div');
      if (r.type === 'd6') {
        die.className = 'dice-result dice-result-d6';
        renderD6(die, r.value);
      } else if (r.type === 'bb') {
        die.className = 'dice-result dice-result-bb';
        renderBB(die, r.face);
      } else {
        die.className = 'dice-result dice-result-num';
        renderNumeric(die, r.value);
      }
      this.rollContainer.appendChild(die);
    });
    this.overlay.classList.add('open');
  }
}
