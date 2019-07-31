const td = require('testdouble')
require('testdouble-jest')(td, jest)

const utils = require('@/base/utils')
const config = require('@/base/config')
const api = require('@/api')
const gql = require('@/gql')
const store = require('@/store')
const logic = require('@/logic')

utils.initUtils()
config.initConfig()
api.initAPI()
gql.initGQL()
store.initStore()
logic.initLogic()

beforeEach(async () => {})

afterEach(function() {
  td.reset()
})
