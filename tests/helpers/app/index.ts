import { Dialogs, injectDialogs, provideDialogs } from '@/app/dialogs'
import { TestAPIContainer, TestLogicContainer, TestStoreContainer } from './logic'
import { InternalLogic } from '@/app/logic/modules/internal'
import { provideLogic } from '@/app/logic'
import { shallowMount } from '@vue/test-utils'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ProvidedDependency {
  api: TestAPIContainer
  store: TestStoreContainer
  internal: InternalLogic
  logic: TestLogicContainer
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
    const {
      dependency: { api, store, internal },
      ...logic
    } = TestLogicContainer.newInstance()
    provideLogic(logic)
    provideDialogs(td.object())

    provided = {
      api,
      store,
      internal,
      logic,
      dialogs: injectDialogs(),
    }
  }

  // setup関数が指定されていなかった場合、providedを返す
  if (!setup) return provided

  // setup関数を実行して戻り値がなかった場合、providedをそのまま返す
  // ※setup関数を実行するとprovidedの依存オブジェクトが更新されてくる
  const setupResult = setup(provided)
  if (!setupResult) return provided

  const { logic, internal, store, api } = setupResult
  if (api) provided.api = Object.assign(provided.api, api)
  if (store) provided.store = Object.assign(provided.store, store)
  if (internal) provided.internal = Object.assign(provided.internal, internal)
  if (logic) provided.logic = Object.assign(provided.logic, logic)

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
export * from './data'
