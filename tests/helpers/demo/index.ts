import { APIKey, injectAPI } from '@/demo/logic/api'
import { Dialogs, injectDialogs, provideDialogs } from '@/app/dialogs'
import { InternalLogic, InternalLogicKey, injectInternalLogic } from '@/app/logic/modules/internal'
import { LogicKey, injectLogic, provideLogic } from '@/demo/logic'
import { StoreKey, injectStore } from '@/demo/logic/store'
import { TestDemoAPIContainer, TestDemoLogicContainer, createTestAPI } from './logic'
import { TestDemoStoreContainer } from './logic'
import { provide } from '@vue/composition-api'
import { shallowMount } from '@vue/test-utils'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ProvidedDependency {
  api: TestDemoAPIContainer
  store: TestDemoStoreContainer
  internal: InternalLogic
  logic: TestDemoLogicContainer
  dialogs: Dialogs
}

type SetupFunc = (provided: ProvidedDependency) => void | Partial<ProvidedDependency>

//========================================================================
//
//  Implementation
//
//========================================================================

let provided: ProvidedDependency | null

/**
 * アプリケーションに必要な依存オブジェクトを登録します。
 * 引数の`setup`を指定しない場合、デフォルトの依存オブジェクトが登録されます。
 * @param setup
 *   デフォルトで登録された依存オブジェクトに対しモック設定を行う関数を指定します。
 *   引数にはデフォルトで登録された依存オブジェクトが渡ってきます。必要であればこの依存オブジェクトに
 *   モック設定を行ってください。引数の依存オブジェクトではなくモックオブジェクトをアプリケーション
 *   に登録したい場合、戻り値としてモックオブジェクトを返すようにしてください。
 */
function provideDependency(setup?: SetupFunc): ProvidedDependency {
  const wrapper = shallowMount<ProvidedDependency & Vue>({
    template: '<div></div>',
    setup() {
      return { ...provideDependencyToVue(setup) }
    },
  })

  const { api, store, internal, logic, dialogs } = wrapper.vm
  return { api, store, internal, logic, dialogs }
}

/**
 * アプリケーションに必要な依存オブジェクトをVueコンポーネントに登録します。
 * 引数の`setup`を指定しない場合、デフォルトの依存オブジェクトが登録されます。
 * @param setup
 *   デフォルトで登録された依存オブジェクトに対しモック設定を行う関数を指定します。
 *   引数にはデフォルトで登録された依存オブジェクトが渡ってきます。必要であればこの依存オブジェクトに
 *   モック設定を行ってください。引数の依存オブジェクトではなくモックオブジェクトをVueコンポーネント
 *   に登録したい場合、戻り値としてモックオブジェクトを返すようにしてください。
 */
function provideDependencyToVue(setup?: SetupFunc): ProvidedDependency {
  if (!provided) {
    provideLogic({
      api: createTestAPI,
    })
    provideDialogs(td.object())

    provided = {
      api: injectAPI() as TestDemoAPIContainer,
      store: injectStore(),
      internal: injectInternalLogic(),
      logic: injectLogic() as TestDemoLogicContainer,
      dialogs: injectDialogs(),
    }
  }

  // setup関数が指定されていなかった場合、providedを返す
  if (!setup) return provided

  // setup関数を実行して戻り値がなかった場合、providedをそのまま返す
  // ※setup関数が実行されるとprovidedの中身の依存オブジェクトが更新される
  const setupResult = setup(provided)
  if (!setupResult) return provided

  const { logic, internal, store, api } = setupResult
  if (api) {
    provided.api = api
    provide(APIKey, provided.api)
  }
  if (store) {
    provided.store = store
    provide(StoreKey, provided.store)
  }
  if (internal) {
    provided.internal = internal
    provide(InternalLogicKey, provided.internal)
  }
  if (logic) {
    provided.logic = logic
    provide(LogicKey, provided.logic)
  }

  return provided
}

function clearProvidedDependency(): void {
  provided = null
}

//========================================================================
//
//  Exports
//
//========================================================================

export { provideDependency, provideDependencyToVue, clearProvidedDependency, ProvidedDependency }
export * from './logic'
