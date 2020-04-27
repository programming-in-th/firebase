import * as admin from 'firebase-admin'
import * as unzipper from 'unzipper'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

export const readCode = async (id: string) => {
  try {
    const submissionDoc = await admin.firestore().doc(`submissions/${id}`).get()
    const taskDoc = submissionDoc.data()?.task
    const type = taskDoc.type
    let len = 1
    if (type !== 'normal') {
      len = taskDoc.fileName.length
    }
    const responseCode: string[] = []
    for (let i = 0; i < len; ++i) {
      const filePath = path.join('submissions', id, i.toString())
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

export const unzipCode = async (code: string, fileName: Array<string>) => {
  const tempZIPpath = path.join(os.tmpdir(), 'file.zip')
  fs.writeFileSync(tempZIPpath, code, 'base64')

  fs.createReadStream(tempZIPpath).pipe(unzipper.Extract({ path: os.tmpdir() }))
  const returnArray: string[] = []

  for (const element of fileName) {
    const readCode = fs.readFileSync(path.join(os.tmpdir(), element), {
      encoding: 'utf8',
    })

    returnArray.push(readCode)
  }
  return returnArray
}
