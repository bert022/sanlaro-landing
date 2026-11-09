import assert from 'node:assert/strict';
import test from 'node:test';
import { assertDevProject, TESTER_FIREBASE } from './tester-config.js';
import { cooldownRemaining, SUBMIT_GAP_MS, validateTester } from './tester-validate.js';

const base = {
  name: 'Ana Reyes',
  email: 'Ana.Reyes+Pilot@gmail.com',
  city: 'Quezon City',
  phoneModel: 'Samsung Galaxy A15',
  sports: ['pickleball', 'volleyball'],
  age18: true,
  privacyConsent: true,
};

test('accepts a Google Play email and normalizes it', () => {
  const result = validateTester(base);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    name: 'Ana Reyes',
    email: 'ana.reyes+pilot@gmail.com',
    city: 'Quezon City',
    phoneModel: 'Samsung Galaxy A15',
    sports: ['pickleball', 'volleyball'],
    age18: true,
    privacyConsent: true,
  });
  assert.equal(result.honeypotFilled, false);
});

test('city, phone, and sports are optional', () => {
  const result = validateTester({ name: 'Bert', email: 'bert@gmail.com', age18: true, privacyConsent: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    name: 'Bert',
    email: 'bert@gmail.com',
    sports: [],
    age18: true,
    privacyConsent: true,
  });
});

test('requires name, a real email, age 18, and privacy consent', () => {
  const result = validateTester({
    name: '   ',
    email: 'not an email',
    sports: ['soccer'],
    age18: false,
    privacyConsent: false,
  });
  assert.equal(result.ok, false);
  assert.equal(result.value, null);
  assert.equal(result.errors.name, 'Enter your name.');
  assert.match(result.errors.email, /Play Store/);
  assert.match(result.errors.sports, /list/);
  assert.match(result.errors.age18, /18/);
  assert.match(result.errors.privacyConsent, /Privacy Policy/);
});

test('rejects dotted junk, a long name, and a duplicate sport is stored once', () => {
  assert.equal(validateTester({ ...base, email: 'a@b..com' }).ok, false);
  assert.equal(validateTester({ ...base, email: 'a@gmail' }).ok, false);
  assert.equal(validateTester({ ...base, name: 'A'.repeat(81) }).errors.name, 'Name is too long.');
  const sports = validateTester({ ...base, sports: ['tennis', 'tennis', 'other'] });
  assert.deepEqual(sports.value && sports.value.sports, ['tennis', 'other']);
});

test('a filled honeypot is flagged and does not block a valid form', () => {
  const result = validateTester({ ...base, faxNumber: 'http://spam.example' });
  assert.equal(result.ok, true);
  assert.equal(result.honeypotFilled, true);
});

test('cooldown is one minute in this browser', () => {
  const now = 1_000_000;
  assert.equal(cooldownRemaining(null, now), 0);
  assert.equal(cooldownRemaining(now - SUBMIT_GAP_MS, now), 0);
  assert.equal(cooldownRemaining(now - 1_000, now), SUBMIT_GAP_MS - 1_000);
  assert.equal(cooldownRemaining('nope', now), 0);
});

test('the public web config is sanlaro-dev and refuses the other projects', () => {
  assert.equal(TESTER_FIREBASE.projectId, 'sanlaro-dev');
  assert.equal(TESTER_FIREBASE.authDomain, 'sanlaro-dev.firebaseapp.com');
  assert.equal(TESTER_FIREBASE.messagingSenderId, '943946709240');
  assert.equal(TESTER_FIREBASE.appId, '1:943946709240:web:e64ed9b51c8bc01d59a30d');
  assert.match(TESTER_FIREBASE.apiKey, /^AIza[0-9A-Za-z_-]{35}$/);
  assert.doesNotThrow(() => assertDevProject(TESTER_FIREBASE));
  assert.throws(() => assertDevProject({ projectId: 'sanlaro' }), /sanlaro-dev/);
  assert.throws(() => assertDevProject({ projectId: 'beleaf-clothing-db' }), /sanlaro-dev/);
  assert.throws(() => assertDevProject({ projectId: 'demo-sanlaro' }), /sanlaro-dev/);
});
