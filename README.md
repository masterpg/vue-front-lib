# vue-front-lib

## プロジェクトセットアップ

### Google Cloud SDK

#### インストール
コマンドプロンプトで次のコマンドを入力します。

```shell
$ brew cask install google-cloud-sdk
```

`gcloud init`を実行して`gcloud`環境を初期化します。

```shell
$ gcloud init
```

> [gsutil をインストールする](https://cloud.google.com/storage/docs/gsutil_install?hl=ja)  
> [Google Cloud SDK を Homebrew で macOS にインストールする](https://qiita.com/niwasawa/items/40845748659892231e04)

### Firebase プロジェクトの設定

#### Firebase プロジェクト名をソースコードに反映
ソースコードプロジェクト`vue-front-lib`にある以下のファイルを開き、Firebase プロジェクト名の部分を作成したFirebase プロジェクト名に変更します。
* vue-front-lib/.env.development
* vue-front-lib/.env.production
* vue-front-lib/.env.staging
* vue-front-lib/.env.test
* vue-front-lib/.firebaserc
* vue-front-lib/firebase.storage.cors.json
* vue-front-lib/package.json

### Storage
Cloud Storage バケットに対して CORS を構成する必要があります。

> [クロスオリジン リソース シェアリング（CORS）の構成](https://cloud.google.com/storage/docs/configuring-cors?hl=ja)

#### 本番環境用
本番環境の CORS の設定内容はコミットされているので、次のコマンドを実行すれば設定完了です。

```shell
$ yarn env:storage
```

#### 開発環境用
開発環境は各開発者によって設定内容が変わるので個別に設定する必要があります。

1. `firebase.storage.cors.json`をコピーし、同じ場所に`firebase.storage.cors.dev.json`という名前で配置します。
2. コピーしたファイルを開き、`origin`の項目を以下の例を参考に、自身の開発環境に合わせて変更します。
```json
[
  {
    "origin": [
      "https://my-app-dev-1234.web.app",
      "https://my-app-dev-1234.firebaseapp.com",
      "http://localhost:5030",
      "http://192.168.1.123:5030"
    ],
    ・・・
  }
]
```
3. 次のコマンドで上記内容を Cloud Storage バケットに設定します。

```shell
$ gsutil cors set firebase.storage.cors.dev.json gs://<your-cloud-storage-bucket>
```

## 単体テスト

### FirestoreEx の単体テスト実行
1. ターミナルで`yarn firestore`を実行。
2. 別のターミナルを開き、`yarn test:firestore-ex`を実行。
