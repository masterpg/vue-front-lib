import { APIKey, injectAPI } from '@/logic/api'
import { Config, ConfigKey, injectConfig, provideConfig } from '@/config'
import { InternalLogic, InternalLogicKey, injectInternalLogic } from '@/logic/modules/internal'
import { LogicContainer, LogicKey, injectLogic, provideLogic } from '@/logic'
import { StoreContainer, StoreKey, injectStore } from '@/logic/store'
import { TestAPIContainer, createTestAPI } from './logic/api'
import { provide } from '@vue/composition-api'
import { shallowMount } from '@vue/test-utils'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ProvidedDependency {
  config: Config
  api: TestAPIContainer
  store: StoreContainer
  internal: InternalLogic
  logic: LogicContainer
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
function provideDependency(setup?: (provided: ProvidedDependency) => Partial<ProvidedDependency> | void): ProvidedDependency {
  const wrapper = shallowMount<ProvidedDependency & Vue>({
    template: '<div></div>',
    setup() {
      return { ...provideDependencyToVue(setup) }
    },
  })

  const { config, api, store, internal, logic } = wrapper.vm
  return { config, api, store, internal, logic }
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
    provideConfig()
    provideLogic({
      api: createTestAPI,
    })

    provided = {
      config: injectConfig(),
      api: injectAPI() as TestAPIContainer,
      store: injectStore(),
      internal: injectInternalLogic(),
      logic: injectLogic(),
    }
  }

  // setup関数が指定されていなかった場合、providedを返す
  if (!setup) return provided

  // setup関数を実行して戻り値がなかった場合、providedをそのまま返す
  // ※setup関数が実行されるとprovidedの中身の依存オブジェクトが更新される
  const setupResult = setup(provided)
  if (!setupResult) return provided

  const { logic, internal, store, api, config } = setupResult
  if (config) {
    provided.config = config
    provide(ConfigKey, provided.config)
  }
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
