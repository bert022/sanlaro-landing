import { assertDevProject, TESTER_FIREBASE } from './tester-config.js';
import { cooldownRemaining, validateTester } from './tester-validate.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { doc, getFirestore, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const ATTEMPT_KEY = 'sanlaro.tester.lastAttempt';
const FIELDS = ['name', 'email', 'city', 'phoneModel', 'sports', 'age18', 'privacyConsent'];

const form = document.querySelector('#tester-form');
const success = document.querySelector('#tester-success');
const successText = document.querySelector('#success-text');
const formError = document.querySelector('#form-error');
const submitButton = document.querySelector('#tester-submit');

/** @type {import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js').Firestore | null} */
let db = null;
let sending = false;

function readClock() {
  try {
    return Number(localStorage.getItem(ATTEMPT_KEY) || 0);
  } catch {
    return 0;
  }
}

function writeClock(value) {
  try {
    if (value) localStorage.setItem(ATTEMPT_KEY, String(value));
    else localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* private mode */
  }
}

/** @param {Record<string, string>} errors */
function showErrors(errors) {
  let focusTarget = null;
  for (const field of FIELDS) {
    const message = errors[field] || '';
    const slot = document.querySelector('#error-' + field);
    if (slot) slot.textContent = message;
    const control = document.querySelector('#' + field);
    if (control) {
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
      if (message && !focusTarget) focusTarget = control;
    }
  }
  if (formError) {
    formError.hidden = true;
    formError.textContent = '';
  }
  if (focusTarget instanceof HTMLElement) focusTarget.focus();
}

/** @param {string} message */
function showFormError(message) {
  if (!formError) return;
  formError.hidden = false;
  formError.textContent = message;
  formError.focus();
}

/** @param {string} email */
function showSuccess(email) {
  if (form instanceof HTMLFormElement) form.hidden = true;
  if (success instanceof HTMLElement) success.hidden = false;
  if (successText) {
    successText.textContent =
      "You're on the list. We'll email the Play testing invite to " +
      email +
      '. Check that inbox, and spam, on the Google account you use in the Play Store.';
  }
  const heading = document.querySelector('#success-heading');
  if (heading instanceof HTMLElement) heading.focus();
}

/** @param {HTMLFormElement} current */
function readForm(current) {
  const data = new FormData(current);
  return {
    name: data.get('name'),
    email: data.get('email'),
    city: data.get('city'),
    phoneModel: data.get('phoneModel'),
    sports: data.getAll('sports'),
    age18: data.get('age18') === 'on',
    privacyConsent: data.get('privacyConsent') === 'on',
    faxNumber: data.get('fax_number'),
  };
}

/** @param {{ name: string, email: string, sports: string[], age18: true, privacyConsent: true, city?: string, phoneModel?: string }} value */
async function saveSignup(value) {
  assertDevProject(TESTER_FIREBASE);
  if (!db) db = getFirestore(initializeApp(TESTER_FIREBASE));
  const payload = {
    name: value.name,
    email: value.email,
    sports: value.sports,
    age18: true,
    privacyConsent: true,
    createdAt: serverTimestamp(),
  };
  if (value.city) payload.city = value.city;
  if (value.phoneModel) payload.phoneModel = value.phoneModel;
  await setDoc(doc(db, 'testerSignups', value.email), payload);
}

/** @param {unknown} error */
function describeWriteError(error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code.includes('already-exists')) {
    return "That Google account is already on the list. We'll email the Play testing invite.";
  }
  if (code.includes('permission-denied')) {
    return "We couldn't save that. If you already signed up with this email, you're on the list and we'll email the invite. If not, email hello@sanlaro.com and we'll add you.";
  }
  return "We couldn't save your sign-up. Email hello@sanlaro.com and we'll add you.";
}

if (form instanceof HTMLFormElement && submitButton instanceof HTMLButtonElement) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    const result = validateTester(readForm(form));
    showErrors(result.errors);
    if (!result.ok || !result.value) return;

    if (result.honeypotFilled) {
      writeClock(Date.now());
      showSuccess(result.value.email);
      return;
    }

    const wait = cooldownRemaining(readClock(), Date.now());
    if (wait > 0) {
      showFormError('Please wait ' + Math.ceil(wait / 1000) + ' seconds before sending another request.');
      return;
    }

    sending = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    writeClock(Date.now());
    try {
      await saveSignup(result.value);
      showSuccess(result.value.email);
    } catch (error) {
      writeClock(0);
      showFormError(describeWriteError(error));
      submitButton.disabled = false;
      submitButton.textContent = 'Request an invite';
      sending = false;
    }
  });
}
