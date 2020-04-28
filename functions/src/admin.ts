import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const checkAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) return false
  const uid = context.auth ? context.auth.uid : ''
  if (!(typeof uid === 'string')) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `admin UID must be a string, given UID = ${uid}`
    )
  }
  try {
    const userSnapshot = await admin.firestore().doc(`users/${uid}`).get()
    if (!userSnapshot.exists) return false
    return userSnapshot.data()!.admin
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
