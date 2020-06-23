import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const getSubmissions = functions
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

export default getSubmissions
