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

function toEntity<T extends RawEntity | RawEntity[] | undefined | null>(rawEntity_or_rawEntities: T): ToEntity<T> {
  if (!rawEntity_or_rawEntities) return undefined as ToEntity<T>

  function to<U extends RawEntity>(entity: U): TimestampEntity<U> {
    const { createdAt, updatedAt, ...others } = entity
    return {
      ...others,
      createdAt: dayjs(createdAt),
      updatedAt: dayjs(updatedAt),
    }
  }

  if (Array.isArray(rawEntity_or_rawEntities)) {
    const rawEntities = rawEntity_or_rawEntities as RawEntity[]
    return rawEntities.map(rawEntity => to(rawEntity)) as ToEntity<T>
  } else {
    const rawEntity = rawEntity_or_rawEntities as RawEntity
    return to(rawEntity) as ToEntity<T>
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RawEntity, ToEntity, toEntity }
