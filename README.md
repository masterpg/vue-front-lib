# vue-base-project

## 環境構築

yarnをインストールします。

```console
$ npm install -g yarn
```

yarnでプロジェクトの依存パッケージをインストールします。

```console
$ yarn install
```


## 開発サーバー

開発サーバーを起動します。

```console
$ yarn serve
```

起動したらブラウザで下記URLにアクセスすることで各画面を確認できます。

* アプリケーション画面: http://localhost:5000
* 単体テスト実行画面: http://localhost:5000/test.html


## プロジェクトビルド

次のコマンドで本番環境を想定したプロジェクトをビルドすることができます。

```console
$ yarn build
```

ビルド結果を検証したい場合、次のコマンドでビルド結果の検証用サーバーを起動します。

```console
$ yarn serve:prod
```

起動したらブラウザで http://localhost:5001 にアクセスすることで画面が表示されます。


## GitBook

GitBookのサーバーを起動します。

```console
$ yarn docs
```

起動したらブラウザで下記URLにアクセスすることで各画面を確認できます。

* GitBook画面: http://localhost:4000

