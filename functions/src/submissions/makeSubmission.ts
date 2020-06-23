import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { unzipCode, writeCode, isAdmin } from '../util'

exports = module.exports = functions
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
