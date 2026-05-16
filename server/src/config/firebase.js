import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount;

// Option 1: JSON string in env var (for cloud deployment)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var');
    process.exit(1);
  }
}
// Option 2: File path (for local development)
else {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
  if (existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } else {
    console.error('❌ Firebase service account not found.');
    console.error('   Set FIREBASE_SERVICE_ACCOUNT env var (cloud) or provide the JSON file (local).');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
