module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.(js|jsx|ts|tsx)|<rootDir>/__tests__/*.(js|jsx|ts|tsx)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // testURL: 'http://localhost:5000',

  // Jestが解析できないモジュールを除外する設定(react-*の部分はサンプル)。
  // 参考: https://jestjs.io/docs/en/tutorial-react-native#transformignorepatterns-customization
  transformIgnorePatterns: ['node_modules/(?!(quasar|react-native|react-native-button)/)'],

  globals: {
    'ts-jest': {
      diagnostics: {
        // TS2315: Type 'Vue' is not generic.
        // TS2614: Module '"*.vue"' has no exported member 'xxx'. Did you mean to use 'import xxx from "*.vue"' instead?
        // TS7006: Parameter 'xxx' implicitly has an 'any' type.
        // TS2305: Module '"aaa/bbb/ccc"' has no exported member 'xxx'.
        ignoreCodes: [2315, 2614, 7006, 2305],
      },
    },
  },
}
