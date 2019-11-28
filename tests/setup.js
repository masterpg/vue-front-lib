global.td = require('testdouble')
require('testdouble-jest')(td, jest)

global.firebase = require('firebase')
require('./mocks/quasar')
const { initConfig } = require('./mocks/config')

initConfig()

beforeEach(async () => {})

afterEach(function() {
  td.reset()
})
