import * as admin from 'firebase-admin';
admin.initializeApp();
// No need to initialize with service account credentials

export * from './submissions'
export * from './tasks'