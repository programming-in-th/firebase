import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

interface category {
  id: string
  name: string
  path?: category[]
}

interface rawCategory {
  id: string
  name: string
  path?: string[]
}

export const getCategory = functions
  .region('asia-east2')
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      res.set('Access-Control-Allow-Origin', '*')

      const categories = await admin.firestore().collection('category').get()
      const categoryMap: { [key: string]: rawCategory } = {}

      for (const doc of categories.docs) {
        const data = doc.data()
        categoryMap[doc.id] = data as rawCategory
      }

      const getChild = (docRef: string): category => {
        const data = categoryMap[docRef]
        const path: category[] = []

        if (data.path) {
          for (const child of data.path) {
            const ret = getChild(child)
            path.push(ret)
          }
        }

        const toReturn: category = {
          name: data.name,
          id: data.id,
          path: path.length === 0 ? undefined : path,
        }

        return toReturn
      }

      const tmp: category[] = []

      if (categoryMap['root'].path) {
        for (const doc of categoryMap['root'].path) {
          const now = getChild(doc)
          tmp.push(now)
        }
      }

      res.send(tmp)
    }
  )
