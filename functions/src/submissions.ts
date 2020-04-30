import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { unzipCode, readCode, writeCode, isAdmin } from './util'

export const makeSubmission = functions
  .region('asia-east2')
  .https.onCall(
    async (requestData: any, context: functions.https.CallableContext) => {
      const { id, lang } = requestData
      let code = requestData.code
      const uid = context.auth?.uid

      if (context.auth === undefined) {
        throw new functions.https.HttpsError('unauthenticated', 'Please login')
      }

      if (!(typeof id === 'string') || id.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Problem ID must be a non-empty string'
        )
      }

      if (!(Array.isArray(code) || typeof code === 'string')) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Code must be a non-empty Array of string'
        )
      }

      if (!(typeof lang === 'string') || lang.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Language must be a non-empty string'
        )
      }

      try {
        const taskSnapshot = await admin
          .firestore()
          .collection('tasks')
          .where('id', '==', id)
          .get()

        if (taskSnapshot.docs.length === 1) {
          const taskDoc = taskSnapshot.docs[0].data()

          if (taskDoc.visible === true || isAdmin(context)) {
            if (typeof code === 'string') {
              code = await unzipCode(code, taskDoc.fileName)

              if (!Array.isArray(code)) {
                throw new functions.https.HttpsError(
                  'invalid-argument',
                  'Code must be in ZIP format or array'
                )
              }
            }
            const submissionID = (
              await admin.firestore().collection('submissions').add({
                problemID: id,
                language: lang,
                points: -1,
                timestamp: admin.firestore.Timestamp.now(),
                uid: uid,
              })
            ).id
            await writeCode(submissionID, code)
            return submissionID
          } else {
            throw new functions.https.HttpsError(
              'permission-denied',
              'Task Permission denied'
            )
          }
        } else {
          throw new functions.https.HttpsError('aborted', 'Task fetching error')
        }
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export const getDetailedSubmissionData = functions
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
        const submissionDocRef = await admin
          .firestore()
          .doc(`submissions/${submissionID}`)
          .get()
        const submissionDoc = submissionDocRef.data()

        const problemID = submissionDoc?.problemID
        const taskSnapshot = await admin
          .firestore()
          .collection('tasks')
          .where('id', '==', problemID)
          .get()
        const taskDoc = taskSnapshot.docs[0].data()

        if (!(taskDoc.visible || isAdmin(context))) {
          return {}
        }
        const firebaseDate = new admin.firestore.Timestamp(
          submissionDoc?.timestamp._seconds,
          submissionDoc?.timestamp._nanoseconds
        )

        const humanTimestamp = firebaseDate.toDate().toLocaleString()

        const codelen =
          submissionDoc?.type === 'normal' ? 1 : taskDoc?.fileName.length

        const code = await readCode(submissionID, codelen)

        const userDocRef = await admin
          .firestore()
          .doc(`users/${submissionDoc?.uid}`)
          .get()
        const userDoc = userDocRef.data()

        delete submissionDoc?.uid

        return {
          ...submissionDoc,
          username: userDoc?.displayName,
          ID: submissionID,
          task: taskDoc,
          humanTimestamp,
          code,
        }
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
