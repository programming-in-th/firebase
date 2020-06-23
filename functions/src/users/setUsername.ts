import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const setUsername = functions
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

export default setUsername
