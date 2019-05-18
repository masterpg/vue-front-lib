const plugins = [
  require('autoprefixer')({}),
  require('postcss-import')({}),
  require('postcss-nested')({}),
  require('postcss-extend')({}),
  require('postcss-mixins')({}),
  require('postcss-each')({}),
  require('postcss-for')({}),
]

if (process.env.QUASAR_RTL) {
  plugins.push(
    require('postcss-rtl')({})
  )
}

module.exports = {
  plugins,
}
