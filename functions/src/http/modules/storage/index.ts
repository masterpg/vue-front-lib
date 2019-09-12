import * as admin from 'firebase-admin'
import { Controller, Get, Params, Req, Res } from 'routing-controllers'
import { Request } from 'firebase-functions/lib/providers/https'
import { Response } from 'express'
const dayjs = require('dayjs')

@Controller()
export class StorageController {
  @Get('/storage/*')
  async getFile(@Req() req: Request, @Res() res: Response, @Params() params: string[]) {
    const filePath = params[0]
    const bucket = admin.storage().bucket()
    const file = bucket.file(filePath)
    const exists = (await file.exists())[0]
    if (!exists) {
      return res.sendStatus(404)
    }

    const lastModified = dayjs(file.metadata.updated).toString()
    const ifModifiedSince = req.header('If-Modified-Since')
    if (lastModified === ifModifiedSince) {
      return res.sendStatus(304)
    }

    res.setHeader('Last-Modified', lastModified)
    res.setHeader('Content-Type', file.metadata.contentType)
    const fileStream = file.createReadStream()

    return fileStream
  }
}
