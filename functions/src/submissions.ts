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
        const taskDocs = await admin
          .firestore()
          .collection('tasks')
          .where('id', '==', id)
          .get()

        if (taskDocs.docs.length === 1) {
          const task = taskDocs.docs[0].data()

          if (task.visible === true || isAdmin(context)) {
            if (typeof code === 'string') {
              code = await unzipCode(code, task.fileName)

              if (!Array.isArray(code)) {
                throw new functions.https.HttpsError(
                  'invalid-argument',
                  'Code must be in ZIP format or array'
                )
              }
            }
            const submissionID = (
              await admin.firestore().collection('submissions').add({
                taskID: id,
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
        const submissionDoc = await admin
          .firestore()
          .doc(`submissions/${submissionID}`)
          .get()
        const submission = submissionDoc.data()

        const taskID = submission?.taskID
        const taskDocs = await admin
          .firestore()
          .collection('tasks')
          .where('id', '==', taskID)
          .get()
        const task = taskDocs.docs[0].data()

        if (!(task.visible || isAdmin(context))) {
          return {}
        }
        const firebaseDate = new admin.firestore.Timestamp(
          submission?.timestamp._seconds,
          submission?.timestamp._nanoseconds
        )

        const humanTimestamp = firebaseDate.toDate().toLocaleString()

        const codelen =
          submission?.type === 'normal' ? 1 : task?.fileName.length

        const code = await readCode(submissionID, codelen)

        const userDoc = await admin
          .firestore()
          .doc(`users/${submission?.uid}`)
          .get()
        const user = userDoc.data()

        delete submission?.uid

        return {
          ...submission,
          username: user?.displayName,
          ID: submissionID,
          task,
          humanTimestamp,
          code,
        }
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export const getSubmissions = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')

      if (!req.query.offset) {
        throw new functions.https.HttpsError(
          'not-found',
          'please insert offset'
        )
      }

      const offset = parseInt(req.query.offset as string)

      try {
        let submissionRef = admin
          .firestore()
          .collection('submissions')
          .orderBy('timestamp', 'desc')

        if (req.query.displayName) {
          const userDocs = await admin
            .firestore()
            .collection('users')
            .where('displayName', '==', req.query.displayName)
            .get()

          if (userDocs.docs.length !== 1) {
            throw new functions.https.HttpsError(
              'aborted',
              'User fetching error'
            )
          }

          const uid = userDocs.docs[0].id
          submissionRef = submissionRef.where('uid', '==', uid)
        }

        if (req.query.taskID) {
          const taskID = req.query.taskID
          submissionRef = submissionRef.where('taskID', '==', taskID)
        }

        submissionRef = submissionRef.offset(offset).limit(10)
        const submissionDocs = await submissionRef.get()

        const temp: Object[] = []

        for (const doc of submissionDocs.docs) {
          const data = doc.data()

          const userDoc = await admin.firestore().doc(`users/${data.uid}`).get()

          const taskDocs = await admin
            .firestore()
            .collection('tasks')
            .where('id', '==', data.taskID)
            .get()

          const task = taskDocs.docs[0].data()

          if (task.visible) {
            const firebaseDate = new admin.firestore.Timestamp(
              data.timestamp._seconds,
              data.timestamp._nanoseconds
            )

            const username = userDoc.data()?.displayName
            const timestamp = data.timestamp
            const humanTimestamp = firebaseDate.toDate().toLocaleString()
            const language = data.language
            const points = data.points
            const taskTitle = task.title
            let time = 0,
              memory = 0

            if (data.groups) {
              for (const group of data.groups) {
                for (const status of group.status) {
                  time = Math.max(time, status.time)
                  memory = Math.max(memory, status.memory)
                }
              }
            }

            temp.push({
              username,
              timestamp,
              humanTimestamp,
              language,
              points,
              taskTitle,
              time,
              memory,
            })
          } else {
            temp.push({})
          }
        }

        res.send(temp)
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
