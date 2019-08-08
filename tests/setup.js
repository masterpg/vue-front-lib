const td = require('testdouble')
require('testdouble-jest')(td, jest)

const utils = require('@/base/utils')
const config = require('@/base/config')

utils.initUtils()
config.initConfig()

beforeEach(async () => {})

afterEach(function() {
  td.reset()
})
