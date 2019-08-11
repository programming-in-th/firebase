import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
// No need to initialize with service account credentials
import server from './server';

export const api = functions.region('asia-east2').https.onRequest(server);
