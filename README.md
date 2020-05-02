# vue-front-lib

## プロジェクトセットアップ

### Google Cloud SDK

#### インストール

コマンドプロンプトで次のコマンドを入力します。

```
$ brew cask install google-cloud-sdk
```

`gcloud init`を実行して`gcloud`環境を初期化します。

```
gcloud init
```

> [gsutil をインストールする](https://cloud.google.com/storage/docs/gsutil_install?hl=ja)  
> [Google Cloud SDK を Homebrew で macOS にインストールする](https://qiita.com/niwasawa/items/40845748659892231e04)

### Firebae

#### Storage

次のコマンドで Cloud Storage の環境設定を行います。

```
$ yarn env:storage
```

> [クロスオリジン リソース シェアリング（CORS）の構成](https://cloud.google.com/storage/docs/configuring-cors?hl=ja)
