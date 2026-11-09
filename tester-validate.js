/** Sports a tester can tick on https://sanlaro.com/become-a-tester. Keep in step with firestore.rules. */
export const SPORTS = ['pickleball', 'badminton', 'volleyball', 'basketball', 'tennis', 'other'];

/** Best-effort gap between submit attempts in one browser. Rules still allow only one row per email. */
export const SUBMIT_GAP_MS = 60_000;

export const LIMITS = { name: 80, email: 120, city: 80, phoneModel: 80 };

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/;

function clean(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/** @param {unknown} value */
export function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

/**
 * @param {{
 *   name?: unknown,
 *   email?: unknown,
 *   city?: unknown,
 *   phoneModel?: unknown,
 *   sports?: unknown,
 *   age18?: unknown,
 *   privacyConsent?: unknown,
 *   faxNumber?: unknown,
 * }} input
 */
export function validateTester(input) {
  /** @type {Record<string, string>} */
  const errors = {};
  const name = clean(input.name);
  if (!name) errors.name = 'Enter your name.';
  else if (name.length > LIMITS.name) errors.name = 'Name is too long.';

  const email = normalizeEmail(input.email);
  if (
    !email ||
    email.length > LIMITS.email ||
    email.includes('..') ||
    email.startsWith('.') ||
    email.includes('@.') ||
    !EMAIL.test(email)
  ) {
    errors.email = 'Enter the Google account email you use in the Play Store.';
  }

  const city = clean(input.city);
  if (city.length > LIMITS.city) errors.city = 'City is too long.';

  const phoneModel = clean(input.phoneModel);
  if (phoneModel.length > LIMITS.phoneModel) errors.phoneModel = 'Phone model is too long.';

  const sports = [];
  const rawSports = Array.isArray(input.sports) ? input.sports : [];
  for (const sport of rawSports) {
    if (typeof sport !== 'string' || !SPORTS.includes(sport)) {
      errors.sports = 'Choose a sport from the list.';
      break;
    }
    if (!sports.includes(sport)) sports.push(sport);
  }

  if (input.age18 !== true) errors.age18 = 'Confirm you are 18 or older.';
  if (input.privacyConsent !== true) errors.privacyConsent = 'Agree to the Privacy Policy to continue.';

  const honeypotFilled = clean(input.faxNumber).length > 0;
  const ok = Object.keys(errors).length === 0;
  const value = ok
    ? {
        name,
        email,
        sports,
        age18: true,
        privacyConsent: true,
        ...(city ? { city } : {}),
        ...(phoneModel ? { phoneModel } : {}),
      }
    : null;
  return { ok, errors, value, honeypotFilled };
}

/**
 * Milliseconds left before another submit from this browser.
 * @param {unknown} lastAt
 * @param {number} now
 * @param {number} [gap]
 */
export function cooldownRemaining(lastAt, now, gap = SUBMIT_GAP_MS) {
  const last = typeof lastAt === 'number' ? lastAt : Number(lastAt);
  if (!Number.isFinite(last) || last <= 0) return 0;
  const left = gap - (now - last);
  return left > 0 ? left : 0;
}
