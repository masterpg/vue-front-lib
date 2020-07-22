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

  globals: {
    'ts-jest': {
      diagnostics: {
        // TS2315: Type 'Vue' is not generic.
        // TS2339: Property 'xxx' does not exist on type 'Vue'.
        // TS2551: Property 'xxx' does not exist on type 'Vue'. Did you mean '$xxx'?
        // TS2347: Untyped function calls may not accept type arguments.
        // TS2305: Module '"*.vue"' has no exported member 'xxx'.
        // TS2614: Module '"*.vue"' has no exported member 'xxx'. Did you mean to use 'import xxx from "*.vue"' instead?
        // TS2344: Type 'xxx' does not satisfy the constraint 'Vue'.
        ignoreCodes: [2315, 2339, 2551, 2347, 2305, 2614, 2344],
      },
    },
  },
}
