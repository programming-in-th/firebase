import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import { isAdmin } from '../util'

exports = module.exports = functions
  .region('asia-east2')
  .https.onCall(
    async (requestData: any, context: functions.https.CallableContext) => {
      const submissionID = requestData?.submissionID
      if (!(typeof submissionID === 'string') || submissionID.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Submission ID must be a non-empty string'
        )
      }

      try {
        const userAdmin = await isAdmin(context)

        if (!userAdmin) {
          return false
        }
        await admin
          .firestore()
          .doc(`submissions/${submissionID}`)
          .update({ status: 'Pending' })
        return true
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
