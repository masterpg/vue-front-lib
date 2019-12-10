global.td = require('testdouble')
require('testdouble-jest')(td, jest)

global.firebase = require('firebase')
require('./mocks/common/quasar')
const { initConfig } = require('./mocks/common/config')

initConfig()

beforeEach(async () => {})

afterEach(function() {
  td.reset()
})
