import { BaseGQLAPIContainer, LibAPIContainer, setAPI } from '@/lib'
import { TestGQLAPIContainerMixin } from '../../../common/logic/api'
import { mix } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

class MockGQLAPIContainer extends BaseGQLAPIContainer {}

class TestLibAPIContainer extends mix(MockGQLAPIContainer).with(TestGQLAPIContainerMixin) {}

function initLibTestAPI(api?: LibAPIContainer): void {
  setAPI(api ? api : new MockGQLAPIContainer())
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestLibAPIContainer, initLibTestAPI }
