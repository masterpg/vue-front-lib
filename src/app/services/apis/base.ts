import { Entity, OmitTimestamp, TimestampEntity } from '@/app/services/base'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

type RawEntity<T = unknown> = Entity &
  OmitTimestamp<T> & {
    createdAt: string
    updatedAt: string
  }

type ToEntity<T> = T extends undefined ? undefined : T extends null ? undefined : TimestampEntity<T>

//========================================================================
//
//  Implementation
//
//========================================================================

function toEntity<T extends RawEntity | undefined | null>(rawEntity: T): ToEntity<T> {
  if (!rawEntity) return undefined as ToEntity<T>

  const { createdAt, updatedAt, ...others } = rawEntity as RawEntity
  return {
    ...others,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  } as ToEntity<T>
}

function toEntities<T extends RawEntity>(rawEntities: T[]): ToEntity<T>[] {
  return rawEntities.map(rawEntity => toEntity(rawEntity)!)
}

//========================================================================
//
//  Examples
//
//========================================================================

namespace Examples {
  /**
   * Rawエンティティをエンティティに変換する型です。
   */
  type ToEntity<T> = T extends undefined ? undefined : T extends null ? undefined : T extends Array<infer R> ? Array<ToEntity<R>> : TimestampEntity<T>

  /**
   * 単一または複数のRawエンティティをエンティティに変換します。
   * @param rawEntity_or_rawEntities
   * @private
   */
  function toEntities<T extends RawEntity | RawEntity[] | undefined | null>(rawEntity_or_rawEntities: T): ToEntity<T> {
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
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RawEntity, ToEntity, toEntity, toEntities }
