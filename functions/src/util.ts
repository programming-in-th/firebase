import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import * as unzipper from 'unzipper'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as crypto from 'crypto'

export const readCode = async (id: string, len: number) => {
  try {
    const responseCode: string[] = []
    for (let i = 0; i < len; ++i) {
      const filePath = `submissions/${id}/${i.toString()}`
      const tempPath = path.join(os.tmpdir(), 'temp')
      await admin
        .storage()
        .bucket()
        .file(filePath)
        .download({ destination: tempPath })
      const code = fs.readFileSync(tempPath, {
        encoding: 'utf8',
      })
      responseCode.push(code)
    }
    return responseCode
  } catch (error) {
    throw error
  }
}

export const writeCode = async (id: string, code: Array<string>) => {
  try {
    for (let i = 0; i < code.length; ++i) {
      const tempPath = path.join(os.tmpdir(), i.toString())
      fs.writeFileSync(tempPath, code[i])
      const bucket = admin.storage().bucket()
      await bucket.upload(tempPath, {
        destination: path.join('submissions', id, i.toString()),
      })
    }
  } catch (error) {
    throw error
  }
}

export const unzipCode = async (code: string, fileName: string[]) => {
  const tempID = crypto.randomBytes(20).toString('hex')
  const tempZIPpath = path.join(os.tmpdir(), tempID, 'file.zip')
  fs.writeFileSync(tempZIPpath, code, 'base64')

  fs.createReadStream(tempZIPpath).pipe(
    unzipper.Extract({ path: path.join(os.tmpdir(), tempID) })
  )
  const returnArray: string[] = []

  for (const element of fileName) {
    const elementPath = path.join(os.tmpdir(), tempID, element)
    let codeRead = ''

    if (fs.existsSync(elementPath)) {
      codeRead = fs.readFileSync(elementPath, {
        encoding: 'utf8',
      })
    }

    returnArray.push(codeRead)
  }
  return returnArray
}

export const isAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) return false

  const uid = context?.auth.uid

  try {
    const userDoc = await admin.firestore().doc(`users/${uid}`).get()
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'data-loss',
        'user not found in database'
      )
    }
    return userDoc.data()?.admin
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error)
  }
}
