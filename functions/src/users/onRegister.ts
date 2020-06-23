import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const initialUser = {
  username: '',
  admin: false,
}

exports = module.exports = functions
  .region('asia-east2')
  .auth.user()
  .onCreate(
    async (user: admin.auth.UserRecord, context: functions.EventContext) => {
      try {
        const uid = user.uid
        await admin.firestore().doc(`users/${uid}`).set(initialUser)
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
