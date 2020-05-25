import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const initialUser = {
  username: '',
  admin: false,
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

export const setUsername = functions
  .region('asia-east2')
  .https.onCall(
    async (requestData: any, context: functions.https.CallableContext) => {
      if (!context.auth) return {}
      try {
        const newuser = requestData.username
        const uid = context.auth.uid
        const userDocs = await admin
          .firestore()
          .collection('users')
          .where('username', '==', newuser)
          .get()
        if (userDocs.docs.length === 0) {
          await admin
            .firestore()
            .doc(`users/${uid}`)
            .update({ username: newuser })
          return true
        } else return false
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
