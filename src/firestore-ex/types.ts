import { Dayjs } from 'dayjs'
import FieldValue = firebase.firestore.FieldValue
import Timestamp = firebase.firestore.Timestamp
import DocumentData = firebase.firestore.DocumentData
import FieldPath = firebase.firestore.FieldPath

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends null
    ? null
    : T[K] extends undefined
    ? undefined
    : T[K] extends Dayjs
    ? Dayjs | FieldValue
    : T[K] extends FieldValue
    ? FieldValue
    : T[K] extends Array<infer R>
    ? Array<DeepPartial<R>>
    : DeepPartial<T[K]>
}

type Storable<T> = {
  [K in keyof T]: T[K] extends null
    ? null
    : T[K] extends undefined
    ? undefined
    : T[K] extends Dayjs
    ? Dayjs | FieldValue
    : T[K] extends FieldValue
    ? FieldValue
    : T[K] extends Array<infer R>
    ? Array<Storable<R>> | FieldValue
    : T[K] extends Record<string, unknown>
    ? Storable<T[K]>
    : T[K] | FieldValue
}

type PartialStorable<T> = {
  [K in keyof T]?: T[K] extends null
    ? null
    : T[K] extends undefined
    ? undefined
    : T[K] extends Dayjs
    ? Dayjs | FieldValue
    : T[K] extends FieldValue
    ? FieldValue
    : T[K] extends Array<infer R>
    ? Array<PartialStorable<R>> | FieldValue
    : T[K] extends Record<string, unknown>
    ? PartialStorable<T[K]>
    : T[K] | FieldValue
}

export type EntityId = { id: string }
type AppTimestamp = { createdAt: Dayjs; updatedAt: Dayjs }
type StoreTimestamp = { createdAt: Timestamp; updatedAt: Timestamp }
export type OmitEntityId<T> = Omit<T, 'id'>
export type OmitEntityTimestamp<T> = Omit<T, 'createdAt' | 'updatedAt'>
export type OmitEntityFields<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
type StoreDoc<T> = OmitEntityFields<T> & EntityId & Partial<StoreTimestamp>
export type EntityAddInput<T> = Storable<OmitEntityFields<T> & Partial<AppTimestamp>>
export type EntitySetInput<T> = Storable<OmitEntityFields<T> & Partial<AppTimestamp>> & EntityId
export type EntityUpdateInput<T> = PartialStorable<OmitEntityFields<T> & AppTimestamp> & EntityId
export type EncodedObject<T> = PartialStorable<OmitEntityFields<T> & StoreTimestamp>
export type DecodedObject<T> = OmitEntityFields<T> & Partial<EntityId & AppTimestamp>
export type EncodeFunc<T, S = DocumentData> = (obj: EntityUpdateInput<T>, operation: WriteOperationType) => EncodedObject<S>
export type DecodeFunc<T, S = T> = (doc: StoreDoc<S>) => DecodedObject<T>
export type QueryKey<T> = keyof T | FieldPath
export type AtomicOperation = Transaction | WriteBatch
export type WriteOperationType = 'add' | 'set' | 'update'

export interface FirestoreExOptions {
  useTimestampInAll?: boolean
}

export type Entity = EntityId
export type TimestampEntity = EntityId & AppTimestamp

export import CollectionReference = firebase.firestore.CollectionReference
export import DocumentReference = firebase.firestore.DocumentReference
export import DocumentSnapshot = firebase.firestore.DocumentSnapshot
export import Firestore = firebase.firestore.Firestore
export import OrderByDirection = firebase.firestore.OrderByDirection
export import Query = firebase.firestore.Query
export import QuerySnapshot = firebase.firestore.QuerySnapshot
export import Transaction = firebase.firestore.Transaction
export import WhereFilterOp = firebase.firestore.WhereFilterOp
export import WriteBatch = firebase.firestore.WriteBatch
export { DocumentData, FieldPath, FieldValue, Timestamp }
