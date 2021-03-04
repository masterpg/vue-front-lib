import { TestAPIContainer, TestServiceContainer, TestStoreContainer } from './services'
import { Dialogs } from '@/app/dialogs'
import { HelperContainer } from '@/app/services/helpers'
import { shallowMount } from '@vue/test-utils'
import { useService } from '@/app/services'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ProvidedDependency {
  apis: TestAPIContainer
  helpers: HelperContainer
  stores: TestStoreContainer
  services: TestServiceContainer
}

type SetupFunc = (provided: ProvidedDependency) => void

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

  const { apis, helpers, stores, services } = wrapper.vm
  return { apis, helpers, stores, services }
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
      dependency: { apis, helpers, stores },
      ...services
    } = TestServiceContainer.newInstance()
    useService(services)
    Dialogs.provide(td.object())

    provided = {
      apis,
      helpers,
      stores,
      services,
    }
  }

  // setup関数が指定されていなかった場合、providedを返す
  if (!setup) return provided

  // setup関数を実行
  // ※setup関数を実行するとprovidedの依存オブジェクトがモック化される
  setup(provided)

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
export * from './services'
export * from './data'
