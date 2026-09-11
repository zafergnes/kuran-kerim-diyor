const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function loadService() {
  const storage = new Map();
  const requests = [];
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../services/dailyVerseService.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = {
    axios: { default: { get: async (_, options) => {
      requests.push(options.params.lang);
      return { data: { text: 'Example', reference: '94:5', surahNumber: 94, startAyah: 5 } };
    } } },
    'expo-localization': { getLocales: () => [{ languageCode: 'tr' }] },
    '@react-native-async-storage/async-storage': { default: {
      getItem: async key => storage.get(key) ?? null,
      setItem: async (key, value) => storage.set(key, value),
    } },
    './apiClient': { API_ORIGIN: 'https://example.test' },
  };
  vm.runInNewContext(code, { exports, require: name => mocks[name], console, Date });
  return { ...exports, storage, requests };
}

test('widget rejects old, undated and wrong-language cached verses', async () => {
  const { DailyVerseService, localDateKey, storage } = loadService();
  for (const value of [{}, { cachedDate: '2000-01-01', language: 'en' }, { cachedDate: localDateKey(), language: 'tr' }]) {
    storage.set('@daily_verse', JSON.stringify({ text: 'Old', ...value }));
    assert.equal(await DailyVerseService.getCachedDailyVerse('en'), null);
  }
});

test('widget fetch uses app language and caches date, language and destination', async () => {
  const { DailyVerseService, localDateKey, storage, requests } = loadService();
  storage.set('@app_language', 'de');
  await DailyVerseService.getDailyVerse();
  assert.equal(requests[0], 'de');
  const cached = await DailyVerseService.getCachedDailyVerse('de');
  assert.equal(cached.cachedDate, localDateKey());
  assert.equal(cached.surahNumber, 94);
  await DailyVerseService.getDailyVerse('fr');
  assert.equal(requests[1], 'fr');
  assert.equal(await DailyVerseService.getCachedDailyVerse('de'), null);
});
