import * as admin from 'firebase-admin'
import * as unzipper from 'unzipper'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

export const readCode = async (id: string, len: number) => {
  try {
    const responseCode: string[] = []
    for (let i = 0; i < len; ++i) {
      const filePath = `submissions/${id}/${i.toString()}`
      const tempPath = path.join(os.tmpdir(), 'temp')
      console.log('filePath =>', filePath)
      console.log('tempPath =>', tempPath)
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
    const codeRead = fs.readFileSync(path.join(os.tmpdir(), element), {
      encoding: 'utf8',
    })

    returnArray.push(codeRead)
  }
  return returnArray
}
