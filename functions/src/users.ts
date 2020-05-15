import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const initialUser = {
  username: '',
  admin: false,
  codeTheme: 'material',
}

export const onRegister = functions
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

export const getUserContext = functions
  .region('asia-east2')
  .https.onCall(
    async (
      requestData: functions.https.Request,
      context: functions.https.CallableContext
    ) => {
      if (!context.auth) return initialUser
      try {
        const uid = context.auth.uid
        const userDoc = await admin.firestore().doc(`users/${uid}`).get()
        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
            'data-loss',
            'user not found in database'
          )
        }
        return userDoc.data()
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
