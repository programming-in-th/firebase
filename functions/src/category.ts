import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

type category = { [key: string]: category[] | string }
type rawCategory = { [key: string]: rawCategory | string }

const getRecursion = (data: rawCategory): category[] => {
  const tmp: category[] = []

  Object.keys(data).forEach((i) => {
    if (i !== 'name') {
      const tmpCat: category = {}

      tmpCat['id'] = i
      const item = data[i] as rawCategory
      tmpCat['name'] = item['name'] as string
      if (Object.keys(item).length > 1) {
        const path: category[] = getRecursion(item)
        tmpCat['path'] = path
      }

      tmp.push(tmpCat)
    }
  })

  return tmp
}

export const getCategory = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')
      const categoryDocs = await admin.firestore().collection('category').get()
      const tmp: rawCategory = {}
      for (const doc of categoryDocs.docs) {
        const data = doc.data()
        const id = doc.id
        tmp[id] = data
      }
      res.send(getRecursion(tmp))
    }
  )
