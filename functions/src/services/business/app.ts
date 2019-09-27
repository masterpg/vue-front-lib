import * as admin from 'firebase-admin'
import { IdToken } from '../base'
import { Injectable } from '@nestjs/common'
import { config } from '../../base/config'

@Injectable()
export class AppService {
  async customToken(user: IdToken): Promise<string> {
    const token = await admin.auth().createCustomToken(user.uid, {
      isAppAdmin: config.role.admins.includes(user.email),
    })
    return token
  }
}
