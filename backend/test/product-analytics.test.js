const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateProductAnalytics } = require('../dist/services/product-analytics.service');

const event = (overrides) => ({
  event: 'SCREEN_VIEW', installId: 'install-a', sessionId: 'session-a',
  screen: 'home', metadata: null, userId: null, createdAt: new Date(), ...overrides,
});

test('funnel counts unique installs, not raw events', () => {
  const result = calculateProductAnalytics([
    event({ event: 'APP_OPEN' }),
    event({ event: 'APP_OPEN', sessionId: 'session-b' }),
    event({ event: 'APP_OPEN', installId: 'install-b', sessionId: 'session-c' }),
    event({ event: 'AUTH_REGISTER', installId: 'install-b', sessionId: 'session-c' }),
  ], []);
  const funnel = Object.fromEntries(result.funnel.map((item) => [item.event, item.uniqueInstalls]));
  assert.equal(funnel.APP_OPEN, 2);
  assert.equal(funnel.AUTH_REGISTER, 1);
  assert.equal(result.activity.appOpens, 3);
  assert.equal(result.activity.sessions, 3);
});

test('newest event in each session becomes the exit stage', () => {
  const result = calculateProductAnalytics([
    event({ sessionId: 'one', screen: 'quran_reader', event: 'APP_BACKGROUND' }),
    event({ sessionId: 'one', screen: 'home', event: 'SCREEN_VIEW' }),
    event({ sessionId: 'two', screen: 'quran_reader', event: 'APP_BACKGROUND' }),
  ], []);
  assert.deepEqual(result.exitStages[0], { stage: 'quran_reader', count: 2 });
});

test('registered progress is not counted twice when an event is linked to the same user', () => {
  const result = calculateProductAnalytics([
    event({
      event: 'READING_PROGRESS', userId: 'user-1',
      metadata: { uniqueAyahs: 6236 },
    }),
  ], [
    { userId: 'user-1', readCounts: JSON.stringify({ '1:1': 1 }), completedSurahs: '[1]' },
    { userId: 'user-2', readCounts: JSON.stringify(Object.fromEntries(Array.from({ length: 6236 }, (_, i) => [`a:${i}`, 1]))), completedSurahs: '[1,2,3]' },
  ]);
  assert.equal(result.engagement.averageQuranProgressPercent, 100);
  assert.equal(result.engagement.averageCompletedSurahs, 2);
});

test('malformed legacy progress rows do not dilute valid averages', () => {
  const result = calculateProductAnalytics([], [
    { userId: 'valid', readCounts: '{}', completedSurahs: '[1,2]' },
    { userId: 'broken', readCounts: '{', completedSurahs: 'not-json' },
  ]);
  assert.equal(result.engagement.averageCompletedSurahs, 2);
  assert.equal(result.engagement.averageQuranProgressPercent, 0);
});
