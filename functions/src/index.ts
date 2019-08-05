import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp({ credential: admin.credential.applicationDefault() });
// TODO: remove object after testing (empty function parameters)
import server from './server';

export const api = functions.https.onRequest(server);