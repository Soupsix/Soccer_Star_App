import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, DocumentReference } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    try {
      initializeApp({
        credential: cert(require(serviceAccountPath)),
      });
    } catch (e) {
      console.warn("Failed to initialize using service-account.json file:", e);
    }
  } else if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else if (projectId) {
    initializeApp({
      projectId,
    });
  } else {
    try {
      initializeApp();
    } catch (e) {
      console.warn("Firebase Admin SDK failed to initialize:", e);
    }
  }
}

export const db = getFirestore();
export const auth = getAuth();
export { Timestamp, FieldValue };

/**
 * Helper to execute multiple operations in a batch write.
 */
export class FirestoreBatchHelper {
  private batch = db.batch();
  private count = 0;

  async set(docRef: DocumentReference, data: any, options?: any): Promise<void> {
    if (options) {
      this.batch.set(docRef, data, options);
    } else {
      this.batch.set(docRef, data);
    }
    this.count++;
    await this.checkCommit();
  }

  async update(docRef: DocumentReference, data: any): Promise<void> {
    this.batch.update(docRef, data);
    this.count++;
    await this.checkCommit();
  }

  async delete(docRef: DocumentReference): Promise<void> {
    this.batch.delete(docRef);
    this.count++;
    await this.checkCommit();
  }

  private async checkCommit(): Promise<void> {
    if (this.count >= 500) {
      await this.commit();
    }
  }

  async commit(): Promise<void> {
    if (this.count > 0) {
      await this.batch.commit();
      this.batch = db.batch();
      this.count = 0;
    }
  }
}
