import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const getCategory = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')
      const categoryDocs = await admin.firestore().collection('category').get()
      const tmp: { [key: string]: Object } = {}
      for (let i = 0; i < categoryDocs.docs.length; ++i) {
        const data = categoryDocs.docs[i].data()
        const id = categoryDocs.docs[i].id
        tmp[id] = data
      }
      res.send(tmp)
    }
  )
