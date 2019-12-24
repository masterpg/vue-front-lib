import { AppAPIContainer, initAPI } from '@/example/logic/api'
import { AppGQLAPIContainer } from '@/example/logic/api/gql'
import { TestGQLAPIContainerMixin } from '../../../common/logic/api'
import { mix } from 'web-base-lib'

//========================================================================
//
//  Exports
//
//========================================================================

export class TestAppAPIContainer extends mix(AppGQLAPIContainer).with(TestGQLAPIContainerMixin) {}

export function initExampleTestAPI(api?: AppAPIContainer): void {
  api = api ? api : new AppGQLAPIContainer()
  initAPI({ apiType: 'gql', api })
}
