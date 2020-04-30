import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const initialUser = {
  displayName: '',
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
        const data = {
          ...initialUser,
          displayName: user.displayName,
        }
        await admin.firestore().doc(`users/${uid}`).set(data)
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export const getUserContext = functions
  .region('asia-east2')
  .https.onCall(
    async (
      request_data: functions.https.Request,
      context: functions.https.CallableContext
    ) => {
      if (!context.auth) return initialUser
      try {
        const uid = context.auth.uid
        const userSnapshot = await admin.firestore().doc(`users/${uid}`).get()
        if (!userSnapshot.exists) {
          throw new functions.https.HttpsError(
            'data-loss',
            'user not found in database'
          )
        }
        return userSnapshot.data()
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
