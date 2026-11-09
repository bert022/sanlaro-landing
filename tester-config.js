/**
 * Public Firebase web config for the sanlaro-dev project only.
 * This identifies the project. It is not a secret. Security is the Firestore rules
 * on testerSignups (create only; no client reads).
 * Never point this file at project "sanlaro" or "beleaf-clothing-db".
 */
export const TESTER_FIREBASE = {
  apiKey: 'AIzaSyDzaq8zdHQG3UrRk8s7LZwO-IOR1QIBlkg',
  authDomain: 'sanlaro-dev.firebaseapp.com',
  projectId: 'sanlaro-dev',
  storageBucket: 'sanlaro-dev.firebasestorage.app',
  messagingSenderId: '943946709240',
  appId: '1:943946709240:web:e64ed9b51c8bc01d59a30d',
};

const BANNED = new Set(['sanlaro', 'beleaf-clothing-db']);

/** Refuses any project other than sanlaro-dev before a write. */
export function assertDevProject(config) {
  const projectId = config && config.projectId;
  if (BANNED.has(projectId) || projectId !== 'sanlaro-dev') {
    throw new Error('Tester sign-ups only write to the sanlaro-dev Firebase project.');
  }
}
