const td = require('testdouble')
require('testdouble-jest')(td, jest)

const utils = require('@/base/utils')
const config = require('@/base/config')
const rest = require('@/rest')
const gql = require('@/gql')
const store = require('@/store')
const logic = require('@/logic')

utils.initUtils()
config.initConfig()
rest.initREST()
gql.initGQL()
store.initStore()
logic.initLogic()

beforeEach(async () => {})

afterEach(function() {
  td.reset()
})
