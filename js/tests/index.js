import { TestRunner } from './TestRunner.js';
import { registerMovementTests } from './movement.test.js';
import { registerTurnTests } from './turns.test.js';

export function runAllTests(rootEl) {
  const runner = new TestRunner();
  registerMovementTests(runner);
  registerTurnTests(runner);
  runner.run(rootEl);
}
