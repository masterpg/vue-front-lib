/**
 * FirestoreEx is built on the basis of Firestore-simple.
 * https://github.com/Kesin11/Firestore-simple.git
 * rev: 9e85b7fbda339e549b01df772327c8a12cdfbda2
 */

export { FirestoreEx, CollectionFactory } from '@/firestore-ex/firestore-ex'
export { Collection } from '@/firestore-ex/collection'
export { Query } from '@/firestore-ex/query'
export {
  DecodeFunc,
  DecodedObject,
  EncodeFunc,
  EncodedObject,
  Entity,
  EntityAddInput,
  EntityId,
  EntitySetInput,
  EntityUpdateInput,
  FieldValue,
  FirestoreExOptions,
  OmitEntityFields,
  OmitEntityId,
  OmitEntityTimestamp,
  Timestamp,
  TimestampEntity,
  Transaction,
  WriteBatch,
} from '@/firestore-ex/types'
