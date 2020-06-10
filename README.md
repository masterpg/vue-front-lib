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
次のコマンドで Cloud Storage の環境設定を行います。

```
$ yarn env:storage
```

> [クロスオリジン リソース シェアリング（CORS）の構成](https://cloud.google.com/storage/docs/configuring-cors?hl=ja)

## 単体テスト

### FirestoreEx の単体テスト実行
1. `vue-front-lib/src/firestore-ex/types.ts`を開き、以下の`import * as firebase …`のコメントを外す。
```ts
// TODO If you want to run a unit test, please uncomment the next line.
//  This is workaround for avoid error which occur using `firestore.FieldValue.increment()` with
//  update() or set(). FieldValue which from `import { firestore } from 'firebase'` maybe can
//  not use when using local emulator. FieldValue which from @firebase/testing is OK.
// import * as firebase from '@firebase/testing'
```
2. ターミナルで`yarn emulators:firestore`を実行。
3. 上記とは別のターミナルを開き、`yarn test:firestore-ex`を実行。
