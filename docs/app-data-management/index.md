# アプリケーションのデータ管理

Vueのように複数のコンポーネントでアプリケーションの画面が構成される場合、アプリケーションであつかうデータをどのように管理するか考える必要があります。


## なぜデータ管理の仕組みが必要なのか

次のようにログインによって影響をうける画面コンポーネントの構成があったとします。

![](./images/view-components-structure.png)

例えばユーザーがログインすると、ユーザー情報画面ではログインユーザーの情報を表示したり、アプリケーション設定画面ではログインユーザーの権限によって表示項目を切り替えたりする必要があります。

各画面コンポーネントがログイン後にユーザーデータを必要とすることは分かりましたが、ユーザーデータをどのように各画面にわたしてあげたらよいでしょうか？

各コンポーネントにデータを受け渡してあげる仕組みとして有名なのが**Flux**や**Redux**になります。

これらFluxやReduxの仕組みをざっくり説明した図が次になります。

![](./images/data-management-structure.png)

まず**Store**ですが、ここにはアプリケーションであつかうデータがすべて保管されています。各コンポーネントはこのStoreに保管されているデータをサブスクライブ(購読)することで、対象のデータに変更があるとそのデータを受け取ることができます。

次に**Action**です。Storeに対してデータを追加、更新、削除するにはActionを経由しておこないます。データの操作をActionに限定することでStoreはデータ変更を検知することができ、またサブスクライブしているコンポーネントに対して変更されたデータをわたすことができます。

このようなデータ管理の仕組みを利用することにより、複数のコンポーネントで画面が構成されていた場合でもデータの受け渡しをおこなうことが可能になります。


## アプリケーションデータを操作する

本プロジェクトではFluxやReduxの考えを参考にデータ管理の仕組みを実装しています。ここでは実装されたデータ管理の仕組みを利用する側の視点で見ていきましょう。

上記でも説明しましたがアプリケーションであつかうデータはすべて**Store**に保管します。ただし**Action**という概念は登場せず、データの追加、更新、削除、サブスクライブといった操作はすべてこのStoreを経由して行うことになります。

次の図は利用者がデータ管理の仕組みにアクセスするためのインタフェースです。今回は例としてショッピングカートを想定したインタフェースを提供しています。

![](./images/shopping-cart-structure.png)

ショッピングカートをデータ設計に落とし込んだ結果、**商品**(`ProductStore`)と**カート**(`CartStore`)という2つのStoreを作成しました。Storeからは、データにアクセスするのに必要なプロパティとメソッドがインタフェースとして提供されます。

`ProductStore`には主に次のようなインタフェースが提供されます:
* `allProducts`: 全商品一覧が取得できるgetter。
* `getAllProducts()`: APIから商品一覧を取得するメソッド。
* `decrementProductInventory()`: 商品の在庫を1つ減らすメソッド。

`CartStore`には主に次のようなインタフェースが提供されます:
* `cartProducts`: カートに入っている商品一覧を取得できるgetter。
* `addProductToCart()`: カートに商品を追加するメソッド。
* `checkout()`: カートに入っている商品を確定するメソッド。


### 対象データをサブスクライブ(購読)する

本プロジェクトのすべてのVueコンポーネントは`this.$stores`でStoreにアクセスすることができます。`$stores`は各Storeを保持しているので、`this.$stores.cart`のように対象のStoreにアクセスすることでデータを操作できます。

ここではサブスクライブ(購読)の実装方法を説明します。対象データをサブスクライブすると、対象データに変更があった場合リアクティブな反応が起こり、自動で画面を更新することができます。

`src/views/shopping-view/index.vue`
```html
<template>
  <div v-for="(product, index) in cartProducts" …>
    …
  </div>
</tamplate>

<script lang="ts">
@Component
export default class CartModal extends mixins(ElementComponent) {
  …
  private get cartProducts(): CartProduct[] {
    return this.$stores.cart.cartProducts;
  }
}
</script>
```

サブスクライブするにはgetterを用意し、この中でStoreが提供するプロパティにアクセスするだけでサブスクライブ状態になります。

上記コードでは`cart.cartProducts`をサブスクライブしており、このプロパティに変更、つまりカートに入っている商品一覧または商品自体に変更があると、画面に表示されているカートの商品一覧も自動で更新されます。

`cart.cartProducts`は配列ですが、配列への追加、削除はもちろん、配列のアイテム(つまり商品オブジェクト)のプロパティに変更があってもリアクティブな反応が起こります。


### 対象データを変更する

アプリケーションデータの変更はStoreが提供するsetterまたはメソッドで行ないます。これ以外にアプリケーションデータを変更する手段はありません。

例えばStoreでgetterを提供していたとして、このgetterの値を変更してもアプリケーションデータは変更されません。なぜならgetterが提供するデータはアプリケーションデータのコピーだからです（コピーである理由は以降で説明します）。


## データ管理の仕組みを実装する

ここまではアプリケーションデータを操作する方法を見てきましたが、以降ではアプリケーションデータを管理するための仕組みを見ていくことにします。

### アプリケーションデータを保管するState

Storeはアプリケーションデータにアクセスするためのプロパティとメソッドを提供すると説明しましたが、アプリケーションデータ自体も保管します。このデータを保管する箱を**State**と呼びます。

次のコードではStateを定義し、Storeのコンストラクタで定義したStateを`BaseStore#initState()`で初期化しています。

`src/store/modules/products-module.ts`

```ts
interface ProductsState {
  all: Product[];
}

@Component
class ProductsStoreImpl extends BaseStore<ProductsState> implements ProductsStore {
  constructor() {
    super();
    this.initState({
      all: [],
    });
  }
}
```

ここでは`ProductsState`というStateを定義し、`BaseStore`のジェネリクスに指定しています。これにより`initState()`で初期化に必要なプロパティが足りなかったり、必要ないプロパティが指定された場合、コンパイラがこれらのエラーを知らせてくれます。

StateはStoreの内部からしかアスセスできません。StoreからStateへは`this.state`でアクセスできます。次はStateにアクセスしている例です。

```ts
const allProducts = this.state.all;
```

アプリケーションデータを変更するということは、Stateの保持するデータを変更するのと同じ意味になります。アプリケーションデータを変更するには次のようにStateのデータを変更します。

```ts
const firstProduct = this.state.all[0];
firstProduct.inventory--;
```


### アプリケーションデータはコピーを返す！

Storeにgetterやメソッドを定義することで、利用者にアプリケーションデータを提供することができます。ただしgetterやメソッドが返すデータはアプリケーションデータの**コピーでなければなりません**。

```ts
import { NoCache } from '../../components';

@Component
class ProductsStoreImpl extends BaseStore<ProductsState> implements ProductsStore {
  @NoCache
  get allProducts(): Product[] {
    // アプリケーションデータのコピーを返している
    return this.cloneDeep(this.state.all);
  }
}
```

なぜコピーを返す必要があるのでしょうか？この理由をさぐるためにコピーではなくアプリケーションデータをそのまま返すケースを考えてみましょう。

```ts
  get allProducts(): Product[] {
    // アプリケーションデータをそのまま返している
    return this.state.all;
  }
```

このgetterの利用者は受け取ったデータを編集用データとして利用することを想定しています。利用者はこのデータを一旦編集したのち、編集内容を検証して、検証結果が正常だった場合だけ編集を確定しようと考えていました。

しかしここではgetterからアプリケーションデータをそのまま受け取っているため、データが編集されると即編集内容が確定されることになります。これにより他の画面でこのgetterを利用している場合、編集内容が検証される前にリアクティブな反応が起こり、画面の更新が行われれてしまします。

getterの利用者が受け取ったデータを表示に利用するか編集に利用するかを設計時にすべて把握するのは困難です。このためアプリケーションデータはコピーを返すことを前提にする必要があるのです。


#### @NoCacheってなに？

Vueでは算出プロパティ(TypeScriptではgetterが算出プロパティにあたる)はキャッシュされます。つまり算出プロパティが返す値に変更がないと算出プロパティは実行されず、キャッシュされた値が返されます。

getterに`@NoCache`をつけると算出プロパティがキャッシュをしなくなります。

次のコードは上記で出てきた「アプリケーションデータのコピーを返す」コードですが、ここでは`@NoCache`を削除してあります。`@NoCache`を削除するとどうなるか考えてみましょう。

```ts
@Component
class ProductsStoreImpl extends BaseStore<ProductsState> implements ProductsStore {
  get allProducts(): Product[] {
    // アプリケーションデータのコピーを返している
    return this.cloneDeep(this.state.all);
  }
}
```

このgetter(算出プロパティ)はキャッシュされます。このため最初の呼び出しは`this.state.all`のコピーが返されますが、2回目以降の呼び出しではgetterは実行されず、キャッシュの値が返されます。

つまり1回目と2回目以降の呼び出しで取得される値は同じ配列の参照となり、コピーを返している意味がなくなっています。

では`@NoCache`を付与するとどうなるでしょう？`@NoCache`を付与すると1回目と2回目以降の呼び出しすべてで異なる配列が返されます。また配列内の各アイテムもコピーされるので、配列内のアイテムもすべてが異なります。

このように`@NoCache`を付与することでgetterの利用者はいろいろ考えずに取得した値を安心して編集用データとして利用できるようになります。

