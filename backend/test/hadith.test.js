const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HadithService,
  HADITH_LANGUAGES,
  hadithExcerpt,
  hadithReference,
  normalizeHadithLanguage,
} = require('../dist/services/hadith.service');

test('every curated hadith has clean text in all six languages and a known grade', () => {
  const hadiths = HadithService.all();
  assert.ok(hadiths.length >= 90);
  assert.equal(new Set(hadiths.map((hadith) => hadith.id)).size, hadiths.length);
  for (const hadith of hadiths) {
    assert.ok(['sahih', 'hasan'].includes(hadith.grade), hadith.id);
    assert.ok(hadith.sources.length > 0, hadith.id);
    for (const lang of HADITH_LANGUAGES) {
      const text = hadith.text[lang];
      assert.ok(text && text.length > 20, `${hadith.id} ${lang}`);
      assert.doesNotMatch(text, /^(حَدَّثَنَا|أَخْبَرَنَا)|Tekrar:|Fethu|<br>/, `${hadith.id} ${lang}`);
    }
  }
});

test('daily hadith follows the local calendar day of the requested time zone', () => {
  // 23:30 UTC on 16 Oct is already 17 Oct in Istanbul.
  const instant = new Date('2026-10-16T23:30:00Z');
  const utc = HadithService.getDaily('UTC', instant);
  const istanbul = HadithService.getDaily('Europe/Istanbul', instant);
  const nextUtcDay = HadithService.getDaily('UTC', new Date('2026-10-17T12:00:00Z'));
  assert.notEqual(utc.id, istanbul.id);
  assert.equal(istanbul.id, nextUtcDay.id);
  assert.equal(HadithService.getDaily('Not/AZone', instant).id, utc.id);
});

test('excerpt keeps the prophetic words and truncates on a word boundary', () => {
  const hadith = HadithService.getById('bukhari-6114');
  assert.equal(
    hadithExcerpt(hadith.text.en),
    'The strong is not the one who overcomes people by his strength, but the strong is the one who controls himself while in anger.',
  );
  const long = hadithExcerpt(HadithService.getById('nawawi-24').text.tr, 120);
  assert.ok(long.length <= 121 && long.endsWith('…'));
});

test('references and language normalization are localized', () => {
  assert.equal(hadithReference(HadithService.getById('bukhari-6114'), 'tr'), 'Buhârî, 6114');
  assert.equal(hadithReference(HadithService.getById('nawawi-13'), 'en'), "An-Nawawi's Forty 13 · al-Bukhari, Muslim");
  assert.equal(normalizeHadithLanguage('zh'), 'tr');
  assert.equal(normalizeHadithLanguage('ar'), 'ar');
});
