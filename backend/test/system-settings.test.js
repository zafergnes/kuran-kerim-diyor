const test = require('node:test');
const assert = require('node:assert/strict');
const { encryptSetting, decryptSetting } = require('../dist/services/system-settings.service');

test('admin secrets are encrypted with authenticated encryption and round-trip safely', () => {
  const previous = process.env.SETTINGS_ENCRYPTION_KEY;
  process.env.SETTINGS_ENCRYPTION_KEY = 'ab'.repeat(32);
  try {
    const secret = 'AIza-example-secret-that-must-not-appear';
    const encrypted = encryptSetting(secret);
    assert.match(encrypted, /^v1:/);
    assert.doesNotMatch(encrypted, /AIza-example/);
    assert.equal(decryptSetting(encrypted), secret);
  } finally {
    if (previous === undefined) delete process.env.SETTINGS_ENCRYPTION_KEY;
    else process.env.SETTINGS_ENCRYPTION_KEY = previous;
  }
});

test('tampering with an encrypted admin secret is rejected', () => {
  const previous = process.env.SETTINGS_ENCRYPTION_KEY;
  process.env.SETTINGS_ENCRYPTION_KEY = 'cd'.repeat(32);
  try {
    const encrypted = encryptSetting('a-valid-secret-value-123456');
    const tampered = `${encrypted.slice(0, -2)}AA`;
    assert.throws(() => decryptSetting(tampered));
  } finally {
    if (previous === undefined) delete process.env.SETTINGS_ENCRYPTION_KEY;
    else process.env.SETTINGS_ENCRYPTION_KEY = previous;
  }
});

test('saving secrets is impossible without a valid 256-bit server encryption key', () => {
  const previous = process.env.SETTINGS_ENCRYPTION_KEY;
  process.env.SETTINGS_ENCRYPTION_KEY = 'too-short';
  try { assert.throws(() => encryptSetting('a-valid-secret-value-123456'), /SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED/); }
  finally { if (previous === undefined) delete process.env.SETTINGS_ENCRYPTION_KEY; else process.env.SETTINGS_ENCRYPTION_KEY = previous; }
});
