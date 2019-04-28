const td = require('testdouble')
require('testdouble-jest')(td, jest)

const utils = require('@/base/utils')
const config = require('@/base/config')
const api = require('@/api')
const store = require('@/store')
const logic = require('@/logic')

utils.initUtils()
config.initConfig()
api.initAPI()
store.initStore()
logic.initLogic()

beforeEach(async () => {})

afterEach(function() {
  td.reset()
})
