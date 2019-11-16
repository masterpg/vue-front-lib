module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.(js|jsx|ts|tsx)|<rootDir>/__tests__/*.(js|jsx|ts|tsx)'],
  testEnvironment: '<rootDir>/tests/environment.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 次の設定はJestがQuasarをパースするよう指定している。(react-*の部分はサンプル)
  // setup.jsではrequire('@/quasar')のようにQuasarコンポーネントをインポートしている。
  // Jestはデフォルトでnode_modulesをパースしないためQuasarもパースされず、JestはQuasarを解析できない。
  // このためTypeScriptでインポートしたQuasarをJestが解析できるようにパースする必要がある。
  // 参考: https://jestjs.io/docs/en/tutorial-react-native#transformignorepatterns-customization
  transformIgnorePatterns: ['node_modules/(?!(quasar|react-native|react-native-button)/)'],
}
