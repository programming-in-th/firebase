import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const getAllProblemIDs = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')

      try {
        const taskDocs = await admin
          .firestore()
          .collection('tasks')
          .where('visible', '==', true)
          .get()

        const result: Object[] = []

        for (const doc of taskDocs.docs) {
          const data = doc.data()
          result.push(data.id)
        }

        res.send(result)
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export const getProblemMetadata = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')
      const id = req.query.id

      if (!(typeof id === 'string')) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `problem ID must be a string, given problem ID = ${id}`
        )
      }

      try {
        const taskDocs = await admin
          .firestore()
          .collection('tasks')
          .where('id', '==', id)
          .get()
        if (taskDocs.docs.length === 0) {
          res.send({})
        }
        if (taskDocs.docs.length !== 1) {
          throw new functions.https.HttpsError('aborted', 'Task fetching error')
        }
        const data = taskDocs.docs[0].data()
        res.send(data.visible ? data : {})
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
