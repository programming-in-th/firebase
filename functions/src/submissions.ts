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
        const taskDoc = await admin.firestore().doc(`tasks/${id}`).get()

        const task = taskDoc.data()

        if (!task) {
          throw new functions.https.HttpsError('data-loss', 'Task not found')
        }

        const taskID = taskDoc.id
        const userAdmin = await isAdmin(context)

        if (task.visible === true || userAdmin) {
          if (typeof code === 'string') {
            code = await unzipCode(code, task.fileName)

            if (!Array.isArray(code)) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                'Code must be in ZIP format or array'
              )
            }
          }

          const fullScore = task.fullScore

          let codelen = 0
          for (const icode of code) {
            codelen += icode.length
          }

          const submissionID = (
            await admin.firestore().collection('submissions').add({
              taskID,
              score: 0,
              fullScore,
              time: 0,
              memory: 0,
              language: lang,
              groups: [],
              codelen,
              timestamp: admin.firestore.Timestamp.now(),
              uid,
              verdict: 'Sending',
            })
          ).id
          await writeCode(submissionID, code)
          await admin.firestore().doc(`submissions/${submissionID}`).update({
            verdict: 'Pending',
          })
          return submissionID
        } else {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Task Permission denied'
          )
        }
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export const getSubmission = functions
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

export const getSubmissions = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')

      try {
        let submissionRef = admin
          .firestore()
          .collection('submissions')
          .orderBy('timestamp', 'desc')

        if (req.query.username) {
          const userDocs = await admin
            .firestore()
            .collection('users')
            .where('username', '==', req.query.username)
            .get()

          if (userDocs.docs.length === 0) {
            res.send({ results: [], next: null })
            return
          }

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

        let offset = 0
        let limit = 10

        if (req.query.limit) {
          limit = parseInt(req.query.limit as string)
        }

        if (req.query.offset) {
          offset = parseInt(req.query.offset as string)
        }

        const getSubmissionRef = submissionRef.offset(offset).limit(limit)
        const getSubmissionDocs = await getSubmissionRef.get()

        const temp: Object[] = []
        for (const doc of getSubmissionDocs.docs) {
          const data = doc.data()
          const userDoc = await admin.firestore().doc(`users/${data.uid}`).get()
          const user = userDoc.data()

          if (!user) {
            throw new functions.https.HttpsError('data-loss', 'User not found')
          }

          const taskDoc = await admin
            .firestore()
            .doc(`tasks/${data.taskID}`)
            .get()

          const task = taskDoc.data()

          if (!task) {
            throw new functions.https.HttpsError('data-loss', 'Task not found')
          }

          if (task.visible) {
            const firebaseDate = new admin.firestore.Timestamp(
              data.timestamp._seconds,
              data.timestamp._nanoseconds
            )
            const username = user.username
            const timestamp = data.timestamp
            const humanTimestamp = firebaseDate.toDate().toLocaleString()
            const language = data.language
            const taskID = taskDoc.id
            const submissionID = doc.id
            const score = data.score
            const fullScore = data.fullScore
            const time = data.time
            const memory = data.memory

            temp.push({
              username,
              timestamp,
              humanTimestamp,
              language,
              score,
              fullScore,
              taskID,
              time,
              memory,
              submissionID,
            })
          } else {
            temp.push({})
          }
        }

        let next = null

        const checkSubmissionRef = submissionRef.offset(offset + limit).limit(1)
        const checkSubmissionDocs = await checkSubmissionRef.get()
        if (checkSubmissionDocs.docs.length !== 0) next = offset + limit
        res.send({ results: temp, next })
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
