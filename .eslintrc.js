const merge = require('lodash/merge')

const prettierConfig = require('./prettier.config')

const eslintConfig = merge(
  require('web-base-lib/conf/.eslintrc.base.js'),
  {
    root: true,
    env: {
      node: true,
    },
    extends: [
      "plugin:vue/essential",
      "eslint:recommended",
      "@vue/typescript/recommended",
      "@vue/prettier",
      "@vue/prettier/@typescript-eslint",
    ],
    parserOptions: {
      ecmaVersion: 2020,
    },
    rules: {
      'prettier/prettier': ['error', prettierConfig],
      '@typescript-eslint/ban-ts-ignore': 'off',
      'no-console': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
    overrides: [
      {
        files: [
          "**/__tests__/*.{j,t}s?(x)",
          "**/tests/unit/**/*.spec.{j,t}s?(x)",
        ],
        env: {
          jest: true,
        }
      }
    ],
    globals: {
      td: false,
    },
  },
)

module.exports = eslintConfig
