import 'firebase/auth'
import 'firebase/firestore'
import { Dayjs } from 'dayjs'
import firebase from 'firebase/app'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Entity {
  id: string
  version: number
}

interface EntityTimestamp {
  createdAt: Dayjs
  updatedAt: Dayjs
}

type OmitTimestamp<T = unknown> = Omit<T, 'createdAt' | 'updatedAt'>

type TimestampEntity<T = unknown> = Entity & OmitTimestamp<T> & EntityTimestamp

//--------------------------------------------------
//  Auth
//--------------------------------------------------

enum AuthStatus {
  None = 'None',
  WaitForEmailVerified = 'WaitForEmailVerified',
  WaitForEntry = 'WaitForEntry',
  Available = 'Available',
}

interface UserClaims {
  isAppAdmin?: boolean
  authStatus?: AuthStatus
}

interface IdToken extends firebase.auth.IdTokenResult, UserClaims {}

//========================================================================
//
//  Implementation
//
//========================================================================

async function getIdToken(): Promise<string> {
  const currentUser = firebase.auth().currentUser
  if (currentUser) {
    return await currentUser.getIdToken()
  } else {
    return ''
  }
}

async function sgetIdToken(): Promise<string> {
  const idToken = getIdToken()
  if (!idToken) throw new Error('Not signed in.')
  return idToken
}

/**
 * エンティティIDを生成します。
 * @param entityName エンティティ名を指定します。
 */
function generateEntityId(entityName: string): string {
  return firebase.firestore().collection(entityName).doc().id
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AuthStatus, Entity, EntityTimestamp, IdToken, OmitTimestamp, TimestampEntity, UserClaims, generateEntityId, getIdToken, sgetIdToken }
