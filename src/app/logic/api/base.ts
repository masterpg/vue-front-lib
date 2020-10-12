import { OmitEntityTimestamp } from '@/firestore-ex'
import { TimestampEntity } from '@/app/logic/base'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RawEntity {
  id: string
}

interface RawTimestampEntity extends RawEntity {
  createdAt: string
  updatedAt: string
}

type ToRawTimestampEntity<T> = OmitEntityTimestamp<T> & RawTimestampEntity

//========================================================================
//
//  Implementation
//
//========================================================================

async function getIdToken(): Promise<string> {
  const currentUser = firebase.auth().currentUser
  if (!currentUser) throw new Error('Not signed in.')
  return await currentUser.getIdToken()
}

function toTimestampEntity<T extends RawTimestampEntity>(entity: T): OmitEntityTimestamp<T> & TimestampEntity {
  const { createdAt, updatedAt, ...otherEntity } = entity
  return {
    ...otherEntity,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  }
}

function toTimestampEntities<T extends RawTimestampEntity>(entities: T[]): (OmitEntityTimestamp<T> & TimestampEntity)[] {
  return entities.map(entity => toTimestampEntity(entity))
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RawEntity, RawTimestampEntity, ToRawTimestampEntity, getIdToken, toTimestampEntities, toTimestampEntity }
