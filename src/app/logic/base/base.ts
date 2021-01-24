import 'firebase/auth'
import 'firebase/firestore'
import { Entity, OmitEntityTimestamp } from '@/firestore-ex'
import { Dayjs } from 'dayjs'
import firebase from 'firebase/app'

//========================================================================
//
//  Interfaces
//
//========================================================================

type TimestampEntity<T = unknown> = Entity &
  OmitEntityTimestamp<T> & {
    createdAt: Dayjs
    updatedAt: Dayjs
  }

interface UserClaims {
  isAppAdmin?: boolean
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

export { IdToken, TimestampEntity, UserClaims, generateEntityId, getIdToken, sgetIdToken }
