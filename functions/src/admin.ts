import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const checkAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) return false
  const uid = context?.auth.uid
  try {
    const userSnapshot = await admin.firestore().doc(`users/${uid}`).get()
    if (!userSnapshot.exists) {
      throw new functions.https.HttpsError(
        'data-loss',
        'user not found in database'
      )
    }
    return userSnapshot.data()?.admin
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error)
  }
}

export const getIsAdmin = functions
  .region('asia-east2')
  .https.onCall(
    async (
      request_data: functions.https.Request,
      context: functions.https.CallableContext
    ) => {
      return checkAdmin(context)
    }
  )
