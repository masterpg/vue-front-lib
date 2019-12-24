import { BaseGQLAPIContainer, LibAPIContainer, setAPI } from '@/lib'
import { TestGQLAPIContainerMixin } from '../../../common/logic/api'
import { mix } from 'web-base-lib'

//========================================================================
//
//  Internal
//
//========================================================================

class MockGQLAPIContainer extends BaseGQLAPIContainer {}

//========================================================================
//
//  Exports
//
//========================================================================

export class TestLibAPIContainer extends mix(MockGQLAPIContainer).with(TestGQLAPIContainerMixin) {}

export function initLibTestAPI(api?: LibAPIContainer): void {
  setAPI(api ? api : new MockGQLAPIContainer())
}
