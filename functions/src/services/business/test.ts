import * as admin from 'firebase-admin'
import { Inject, Injectable } from '@nestjs/common'
import { DocumentReference } from '@google-cloud/firestore'
import { FirestoreService } from '../base'
import { PutTestDataInput } from './types'
const firebase_tools = require('firebase-tools')

@Injectable()
export class TestService {
  constructor(@Inject(FirestoreService) protected readonly firestoreService: FirestoreService) {}

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async putTestData(inputs: PutTestDataInput[]): Promise<void> {
    {
      const processes: Promise<void>[] = []
      for (const item of inputs) {
        processes.push(this.m_deleteCollection(item.collectionName))
      }
      await Promise.all(processes)
    }

    {
      const processes: Promise<void>[] = []
      for (const item of inputs) {
        processes.push(this.m_buildCollection(item.collectionName, item.collectionRecords))
      }
      await Promise.all(processes)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_deleteCollection(collectionName: string): Promise<void> {
    await this.firestoreService.deepDeleteCollection(collectionName)
  }

  private async m_deleteCollectionWithFirebaseTools(collectionName: string): Promise<void> {
    await firebase_tools.firestore.delete(collectionName, {
      project: process.env.GCLOUD_PROJECT,
      recursive: true,
      yes: true,
      // token: functions.config().fb.token,
    })
  }

  private async m_buildCollection(collectionName: string, collectionRows: any[]): Promise<void> {
    const docs = await this.m_createCollectionDocs(collectionName, collectionRows)
    const db = admin.firestore()
    await db.runTransaction(async transaction => {
      for (const doc of docs) {
        transaction.create(doc.ref, doc.data)
      }
    })
  }

  private async m_createCollectionDocs(
    collectionName: string,
    collectionRows: any[],
    parentDoc?: DocumentReference
  ): Promise<{ ref: DocumentReference; data: any }[]> {
    const db = admin.firestore()
    const result: { ref: DocumentReference; data: any }[] = []

    for (const collectionRow of collectionRows) {
      // ドキュメントリファレンスの作成
      let docRef: DocumentReference
      // 親ドキュメントがない場合
      if (!parentDoc) {
        docRef = db.collection(collectionName).doc(collectionRow.id)
      }
      // 親ドキュメントがある場合
      else {
        docRef = parentDoc.collection(collectionName).doc(collectionRow.id)
      }

      // ドキュメントデータの作成
      const docData: any = {}
      for (const memberKey of Object.keys(collectionRow)) {
        if (memberKey === 'id') continue
        const memberItem = collectionRow[memberKey]
        // メンバーアイテムがオブジェクト配列の場合、コレクションとみなす
        if (this.m_isArray(memberItem) && memberItem.length && this.m_isObject(memberItem[0])) {
          const docs = await this.m_createCollectionDocs(memberKey, memberItem, docRef)
          result.push(...docs)
        }
        // 上記以外はメンバーアイテムをプリミティブな型とみなす
        else {
          docData[memberKey] = memberItem
        }
      }
      result.push({ ref: docRef, data: docData })
    }

    return result
  }

  private m_isArray(value: any) {
    return Array.isArray(value)
  }

  private m_isObject(value: any): boolean {
    return value instanceof Object && !(value instanceof Array)
  }
}
