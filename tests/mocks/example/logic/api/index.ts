import { AppAPIContainer } from '../../../../../src/example/logic/api/base'
import { AppGQLAPIContainer } from '../../../../../src/example/logic/api/gql'
import { TestGQLAPIContainerMixin } from '../../../common/logic/api'
import { initAPI } from '@/example/logic'
import { mix } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

class TestAppAPIContainer extends mix(AppGQLAPIContainer).with(TestGQLAPIContainerMixin) {}

function initExampleTestAPI(api?: AppAPIContainer): void {
  api = api ? api : new AppGQLAPIContainer()
  initAPI({ apiType: 'gql', api })
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestAppAPIContainer, initExampleTestAPI }
