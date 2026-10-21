import assert from 'node:assert/strict';

import { twoLegTensionEach, workingLoad } from '@/src/domain/extra/rigging';

test('a 60 degree sling angle shares the load by the sine of the angle', () => {
  const each = twoLegTensionEach(1000, 60);
  assert.ok(each);
  assert.ok(Math.abs(each - 500 / Math.sin((60 * Math.PI) / 180)) < 1e-6);
});

test('working load is breaking strength divided by the design factor', () => {
  assert.equal(workingLoad(10000, 5), 2000);
});
