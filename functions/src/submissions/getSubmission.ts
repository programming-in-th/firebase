import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { readCode, isAdmin } from '../util'

const getSubmission = functions
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
        const submissionDoc = await admin
          .firestore()
          .doc(`submissions/${submissionID}`)
          .get()
        const submission = submissionDoc.data()

        if (!submission) {
          throw new functions.https.HttpsError(
            'data-loss',
            'Submission not found'
          )
        }

        const taskID = submission.taskID
        const taskDoc = await admin.firestore().doc(`tasks/${taskID}`).get()

        const task = taskDoc.data()

        if (!task) {
          throw new functions.https.HttpsError('data-loss', 'Task not found')
        }
        task.id = taskDoc.id
        const userAdmin = await isAdmin(context)

        if (!(task.visible || userAdmin)) {
          return {}
        }

        const codelen = task.type === 'normal' ? 1 : task.fileName.length

        const code = await readCode(submissionID, codelen)

        const userDoc = await admin
          .firestore()
          .doc(`users/${submission.uid}`)
          .get()
        const user = userDoc.data()

        if (!user) {
          throw new functions.https.HttpsError('data-loss', 'User not found')
        }

        return {
          ...submission,
          username: user.username,
          task,
          code,
        }
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export default getSubmission
