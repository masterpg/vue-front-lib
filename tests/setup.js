global.td = require('testdouble')
require('testdouble-jest')(td, jest)
global.firebase = require('firebase')

jest.setTimeout(25000)

beforeEach(async () => {})

afterEach(function() {
  td.reset()
})
