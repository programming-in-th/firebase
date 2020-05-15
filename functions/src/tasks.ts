import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const getTasks = functions
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
          data.id = doc.id
          result.push(data)
        }

        res.send(result)
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export const getTaskIDs = functions
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

        const result: string[] = []

        for (const doc of taskDocs.docs) {
          result.push(doc.id)
        }

        res.send(result)
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )

export const getTask = functions
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
        const taskDoc = await admin.firestore().doc(`tasks/${id}`).get()
        const data = taskDoc.data()
        if (data) {
          res.send(data.visible ? data : {})
        } else {
          res.send({})
        }
      } catch (error) {
        throw new functions.https.HttpsError('unknown', error)
      }
    }
  )
