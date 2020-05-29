// TODO If you want to run a unit test, please uncomment the next line.
//  This is workaround for avoid error which occur using `firestore.FieldValue.increment()` with
//  update() or set(). FieldValue which from `import { firestore } from 'firebase'` maybe can
//  not use when using local emulator. FieldValue which from @firebase/testing is OK.
import * as firebase from '@firebase/testing'

import FieldValue = firebase.firestore.FieldValue
import Timestamp = firebase.firestore.Timestamp
import DocumentData = firebase.firestore.DocumentData
import FieldPath = firebase.firestore.FieldPath

export type EntityId = { id: string }
export type OmitEntityId<T> = Omit<T, 'id'>
export type OmitEntityTimestamp<T> = Omit<T, 'createdAt' | 'updatedAt'>
export type OmitEntityFields<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
type Storable<T> = { [P in keyof T]: P extends 'id' ? T[P] : T[P] | FieldValue } & EntityId
export type StoreDoc<T> = T & EntityId & { createdAt: Timestamp; updatedAt: Timestamp }
export type EntityInput<T> = OmitEntityTimestamp<Storable<T>>
export type EntityOptionalInput<T> = Partial<EntityInput<T>>
export type EncodedObject<T> = Partial<OmitEntityFields<Storable<T>>>
export type DecodedObject<T> = OmitEntityFields<T>
export type EncodeFunc<T, S = DocumentData> = (obj: EntityOptionalInput<T>) => EncodedObject<S>
export type DecodeFunc<T, S = T> = (doc: StoreDoc<S>) => DecodedObject<T>
export type QueryKey<T> = keyof T | FieldPath
export type AtomicOperation = Transaction | WriteBatch

export type TimeStampToDate = (timestamp: Timestamp) => any

export interface FirestoreExOptions {
  useTimestampInAll?: boolean
  timestampToDate?: TimeStampToDate
}

export interface TimestampSettings {
  use: boolean
  toDate: TimeStampToDate
}

export interface Entity {
  id: string
}

export interface TimestampEntity<D = Date> {
  id: string
  createdAt: D
  updatedAt: D
}

export import CollectionReference = firebase.firestore.CollectionReference
export import DocumentData = firebase.firestore.DocumentData
export import DocumentReference = firebase.firestore.DocumentReference
export import DocumentSnapshot = firebase.firestore.DocumentSnapshot
export import FieldPath = firebase.firestore.FieldPath
export import FieldValue = firebase.firestore.FieldValue
export import Firestore = firebase.firestore.Firestore
export import OrderByDirection = firebase.firestore.OrderByDirection
export import Query = firebase.firestore.Query
export import QuerySnapshot = firebase.firestore.QuerySnapshot
export import Timestamp = firebase.firestore.Timestamp
export import Transaction = firebase.firestore.Transaction
export import WhereFilterOp = firebase.firestore.WhereFilterOp
export import WriteBatch = firebase.firestore.WriteBatch
