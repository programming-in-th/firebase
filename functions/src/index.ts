import * as admin from 'firebase-admin'
admin.initializeApp({
  storageBucket: 'proginth.appspot.com',
})
// No need to initialize with service account credentials

export * from './tasks'
export * from './submissions'
export * from './users'
export * from './admin'
