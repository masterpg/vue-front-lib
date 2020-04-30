const merge = require('lodash/merge')

const prettierConfig = require('./prettier.config')

const eslintConfig = merge(
  require('web-base-lib/conf/.eslintrc.base.js'),
  {
    'extends': [
      "plugin:vue/essential",
      "eslint:recommended",
      "@vue/typescript/recommended",
      "@vue/prettier",
      "@vue/prettier/@typescript-eslint"
    ],
    'rules': {
      'prettier/prettier': ['error', prettierConfig],
      '@typescript-eslint/ban-ts-ignore': 'off',
      'no-console': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
    'env': {
      'jest': true,
    },
    'globals': {
      'firebase': false,
      'td': false,
    },
  },
)

module.exports = eslintConfig
