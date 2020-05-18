import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const getCategory = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')
      const doc = await admin.firestore().doc('constant/category').get()
      const data = doc.data()?.data
      res.send(data)
    }
  )
