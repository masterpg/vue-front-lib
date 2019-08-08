import * as firebaseAdmin from 'firebase-admin'
import { Arg, Mutation, Query, Resolver } from 'type-graphql'
import { Field, InputType } from 'type-graphql'
import { DocumentReference } from '@google-cloud/firestore'
import { GraphQLJSONObject } from 'graphql-type-json'
const firebase_tools = require('firebase-tools')

@InputType()
export class PutTestDataInput {
  @Field(type => String)
  collectionName!: string

  @Field(type => [GraphQLJSONObject])
  collectionRecords!: any[]
}

@Resolver()
export class TestResolver {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  @Mutation(returns => Boolean)
  async putTestData(@Arg('testData', returns => [PutTestDataInput]) testData: PutTestDataInput[]): Promise<boolean> {
    {
      const processes: Promise<void>[] = []
      for (const item of testData) {
        processes.push(this.m_deleteCollection(item.collectionName))
      }
      await Promise.all(processes)
    }

    {
      const processes: Promise<void>[] = []
      for (const item of testData) {
        processes.push(this.m_buildCollection(item.collectionName, item.collectionRecords))
      }
      await Promise.all(processes)
    }

    return true
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_deleteCollection(collectionName: string): Promise<void> {
    await firebase_tools.firestore.delete(collectionName, {
      project: process.env.GCLOUD_PROJECT,
      recursive: true,
      yes: true,
      // token: functions.config().fb.token,
    })
  }

  private async m_buildCollection(collectionKey: string, collectionRows: any[], parentDoc?: DocumentReference): Promise<void> {
    const db = firebaseAdmin.firestore()

    for (const collectionRow of collectionRows) {
      // ドキュメントリファレンスの作成
      let docRef: DocumentReference
      // 親ドキュメントがない場合
      if (!parentDoc) {
        docRef = db.collection(collectionKey).doc(collectionRow.id)
      }
      // 親ドキュメントがある場合
      else {
        docRef = parentDoc.collection(collectionKey).doc(collectionRow.id)
      }

      // ドキュメントデータの作成
      const docData: any = {}
      for (const memberKey of Object.keys(collectionRow)) {
        if (memberKey === 'id') continue
        const memberItem = collectionRow[memberKey]
        // メンバーアイテムがオブジェクト配列の場合、コレクションとみなす
        if (this.m_isArray(memberItem) && memberItem.length && this.m_isObject(memberItem[0])) {
          await this.m_buildCollection(memberKey, memberItem, docRef)
        }
        // 上記以外はメンバーアイテムをプリミティブな型とみなす
        else {
          docData[memberKey] = memberItem
        }
      }
      await docRef.set(docData)
    }
  }

  private m_isArray(value: any) {
    return Array.isArray(value)
  }

  private m_isObject(value: any): boolean {
    return value instanceof Object && !(value instanceof Array)
  }
}
