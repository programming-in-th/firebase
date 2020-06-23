import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const getUserContext = functions
  .region('asia-east2')
  .https.onCall(
    async (
      requestData: functions.https.Request,
      context: functions.https.CallableContext
    ) => {
      if (!context.auth) return {}
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

export default getUserContext
