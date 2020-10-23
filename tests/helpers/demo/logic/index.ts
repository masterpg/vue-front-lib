import { DemoLogicContainer } from '@/demo/logic'
import { TestLogicContainer } from '../../app/logic'

//========================================================================
//
//  Interfaces
//
//========================================================================

type TestDemoLogicContainer = DemoLogicContainer & TestLogicContainer

//========================================================================
//
//  Exports
//
//========================================================================

export { TestDemoLogicContainer }
export * from './api'
export * from './store'
