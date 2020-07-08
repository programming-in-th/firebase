import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

exports = module.exports = functions
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
            res.send({ data: [], next: null })
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

        if (req.query.next) {
          const submissionDoc = await admin
            .firestore()
            .doc(`submissions/${req.query.next}`)
            .get()
          submissionRef = submissionRef.startAt(submissionDoc)
        }

        let limit = 10

        if (req.query.limit) {
          limit = parseInt(req.query.limit as string)
        }

        const getSubmissionRef = submissionRef.limit(limit + 1)
        const getSubmissionDocs = await getSubmissionRef.get()

        const temp: Object[] = []
        for (
          let i = 0;
          i < Math.min(limit, getSubmissionDocs.docs.length);
          ++i
        ) {
          const doc = getSubmissionDocs.docs[i]
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
            const username = user.username
            const timestamp = data.timestamp
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

        if (getSubmissionDocs.docs.length === limit + 1) {
          next = getSubmissionDocs.docs[limit].id
        }

        res.send({ data: temp, next })
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
