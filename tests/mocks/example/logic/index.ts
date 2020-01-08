import * as td from 'testdouble'
import { AuthLogic } from '@/lib'
import { Component } from 'vue-property-decorator'
import { LogicContainerImpl } from '@/example/logic'

@Component
export class MockLogicContainer extends LogicContainerImpl {
  protected newAuthLogic(): AuthLogic {
    // 単体テストの対象外の箇所でエラーが発生するためAuthLogicはモックに置き換える。
    // エラー例: UserStore.isSignedInの値が変更されるとAuthLogicのイベントハンドラが実行されてエラーが発生
    return td.object<AuthLogic>()
  }
}
