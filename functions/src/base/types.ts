import * as firebaseAdmin from 'firebase-admin'

export interface IdToken extends firebaseAdmin.auth.DecodedIdToken {
  appAdmin?: string
}
