const { assertValidTransition } = require('../src/services/inquiryService');

function getError(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error('Expected function to throw');
}

describe('Status transition rules', () => {
  test.each([
    ['NEW', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'RESOLVED'],
    ['IN_PROGRESS', 'NEW'],
    ['RESOLVED', 'IN_PROGRESS'], // reopen
  ])('allows %s → %s', (from, to) => {
    expect(() => assertValidTransition(from, to)).not.toThrow();
  });

  test.each([
    ['NEW', 'RESOLVED'],      // can't skip "in progress"
    ['RESOLVED', 'NEW'],
    ['NEW', 'NEW'],           // no-op change
  ])('rejects %s → %s with 422', (from, to) => {
    const err = getError(() => assertValidTransition(from, to));
    expect(err).toMatchObject({ status: 422, code: 'INVALID_STATUS_TRANSITION' });
  });
});