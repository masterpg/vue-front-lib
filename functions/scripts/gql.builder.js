const chokidar = require('chokidar')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const GraphQLDefinitionsFactory = require('@nestjs/graphql').GraphQLDefinitionsFactory

// `--watch`オプションが指定されたか取得
let watch = false
if (process.argv.length >= 3 && process.argv[2] === '--watch') {
  watch = true
}

// `src`配下`*.graphql`ファイルの一覧を取得
const graphqlFiles = glob.sync(path.join(process.cwd(), 'src/**/*.graphql'))
for (const srcFilePath of graphqlFiles) {
  // `src`ベースのパスを`lib`ベースへ置き換え
  // 例: src/gql/modules/product/product.graphql → lib/gql/modules/product/product.graphql
  const libFilePath = srcFilePath.replace(/\/?(src)\//, (match, $1, offset) => {
    return match.replace($1, 'lib')
  })
  // `src`から`lib`へ`.graphql`ファイルをコピー
  fs.mkdirSync(path.dirname(libFilePath), { recursive: true })
  fs.copyFileSync(srcFilePath, libFilePath)
  if (!watch) continue

  // `src`配下の`.graphql`ファイルに変更があった場合、
  // `src`から`lib`へ`.graphql`ファイルをコピー
  chokidar.watch(srcFilePath, { persistent: true }).on('change', path => {
    fs.copyFileSync(srcFilePath, libFilePath)
  })
}

// `src`配下の`.graphql`ファイルをもとに、
// GraphQLの定義からTypeScriptの型定義を作成
const definitionsFactory = new GraphQLDefinitionsFactory()
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: path.join(process.cwd(), 'src/gql.schema.ts'),
  outputAs: 'interface',
  watch,
})
