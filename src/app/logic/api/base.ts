import { Entity, OmitEntityTimestamp } from '@/firestore-ex'
import { TimestampEntity } from '@/app/logic/base'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

type RawEntity<T = {}> = Entity &
  OmitEntityTimestamp<T> & {
    createdAt: string
    updatedAt: string
  }

type ToEntity<T> = T extends undefined ? undefined : T extends null ? undefined : T extends Array<infer R> ? Array<ToEntity<R>> : TimestampEntity<T>

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

function toEntity<T extends RawEntity | RawEntity[] | undefined | null>(entity_or_entities: T): ToEntity<T> {
  if (!entity_or_entities) {
    return undefined as any
  }

  function to<U extends RawEntity>(entity: U): TimestampEntity<U> {
    const { createdAt, updatedAt, ...others } = entity
    return {
      ...others,
      createdAt: dayjs(createdAt),
      updatedAt: dayjs(updatedAt),
    }
  }

  if (Array.isArray(entity_or_entities)) {
    const entities = entity_or_entities as RawEntity[]
    const result: TimestampEntity<RawEntity>[] = []
    for (const entity of entities) {
      result.push(to(entity))
    }
    return result as ToEntity<T>
  } else {
    const entity = entity_or_entities as RawEntity
    return to(entity) as ToEntity<T>
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RawEntity, getIdToken, toEntity }
