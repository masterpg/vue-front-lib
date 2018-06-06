# vue-www-base

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
$ yarn dev
```

起動したらブラウザで下記URLにアクセスすることで各画面を確認できます。

* アプリケーション画面: http://localhost:5000
* 単体テスト実行画面: http://localhost:5000/test.html


## プロジェクトビルド

次のコマンドで本番環境を想定したプロジェクトをビルドすることができます。

```console
$ yarn build
```

本番環境用のビルド結果を開発サーバーで確認するには次のコマンドを実行します。

```console
$ yarn stg
```

起動したらブラウザで http://localhost:5000 にアクセスすることで画面が表示されます。


## GitBook

GitBookのサーバーを起動します。

```console
$ yarn docs
```

起動したらブラウザで下記URLにアクセスすることで各画面を確認できます。

* GitBook画面: http://localhost:4000

