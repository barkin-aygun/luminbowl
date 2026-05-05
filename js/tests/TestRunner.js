export class TestRunner {
  constructor() {
    this._suites = [];
    this._current = null;
  }

  describe(name, fn) {
    this._current = { name, tests: [] };
    this._suites.push(this._current);
    fn();
    this._current = null;
  }

  it(name, fn) {
    if (!this._current) throw new Error('it() called outside describe()');
    this._current.tests.push({ name, fn });
  }

  run(rootEl) {
    let passed = 0;
    let failed = 0;

    this._suites.forEach(suite => {
      const suiteEl = document.createElement('div');
      suiteEl.className = 'test-suite';
      suiteEl.textContent = suite.name;
      rootEl.appendChild(suiteEl);

      suite.tests.forEach(test => {
        const el = document.createElement('div');
        try {
          test.fn();
          el.className = 'test-pass';
          el.textContent = `  ✓ ${test.name}`;
          passed++;
        } catch (err) {
          el.className = 'test-fail';
          el.textContent = `  ✗ ${test.name}: ${err.message}`;
          failed++;
        }
        rootEl.appendChild(el);
      });
    });

    const summary = document.createElement('div');
    summary.className = 'test-summary';
    summary.textContent = `${passed} passed, ${failed} failed`;
    summary.style.color = failed === 0 ? '#4caf50' : '#f44336';
    rootEl.appendChild(summary);
  }
}

export const assert = {
  equal(a, b, msg) {
    if (a !== b) throw new Error(msg ?? `expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
  },
  deepEqual(a, b, msg) {
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if (sa !== sb) throw new Error(msg ?? `expected ${sa} deep-equal ${sb}`);
  },
  ok(val, msg) {
    if (!val) throw new Error(msg ?? `expected truthy, got ${val}`);
  },
  throws(fn, expectedMsg) {
    let threw = false;
    try { fn(); } catch (e) {
      threw = true;
      if (expectedMsg && !e.message.includes(expectedMsg)) {
        throw new Error(`expected error containing "${expectedMsg}" but got "${e.message}"`);
      }
    }
    if (!threw) throw new Error('expected function to throw');
  }
};
