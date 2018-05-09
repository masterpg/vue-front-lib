# Vue + TypeScript

## Data

TypeScriptでインスタンス変数を定義すると、その変数はHTMLでバインディング可能になります。

```html
<template>
  <div>{{ message }}</div>
</template>

<script lang="ts">
  @Component
  export default class ExampleView extends VueComponent {
    private message: string = '';
  }
</script>
```

インスタンス変数の値が変わるとHTMLでバインドされた箇所も自動で更新されます。

インスタンス変数にはオブジェクトも設定できます。

```html
<template>
  <div>{{ post.message }}</div>
</template>

<script lang="ts">
  @Component
  export default class ExampleView extends VueComponent {
    private post: Post = {
      title: '',
      message: '',
    };
  }

  private postButtonOnClick() {
    this.post.message = this.message;
  }
</script>
```

注意点として、インスタンス変数は必ず定義時に初期化してください。初期化しないとバインディングが機能しません。

次はバインディングが機能しない例です。

```ts
@Component
export default class ExampleView extends VueComponent {
  // 変数を初期化していないのでバインディングが機能しない
  private message: string;
}
```


## Props

`@Prop`を指定した変数はHTML属性として外部に公開され、その属性を経由して外部から値を受け取ることができます。

```ts
@Component
export default class BlogPost extends VueComponent {
  // 変数名はキャメルケース
  @Prop()
  postTitle: string;
}
```

```html
<!-- HTMLの属性名はケバブケース -->
<blog-post post-title="hello!"></blog-post>
```

PropsはDataと同様にHTMLにもバインディング可能です。

```html
<template>
  <div>{{ postTitle }}</div>
</template>

<script lang="ts">
  export default class BlogPost extends VueComponent {
    @Prop()
    postTitle: string;
  }
</script>
```

注意点として、変数に直接値を設定することはできません。

```ts
// Vueでエラーが起こる
@Prop()
postTitle: string = 'hello!';
```

初期値は`@Prop`の`default`オプションで設定できます。

```ts
@Prop({ default: 'hello!' })
postTitle: string;
```


## Computed

算出プロパティはgetterになります。getterの中でDataまたはPropsの変数を参照すると、変数の値変更を感知し、算出プロパティが自動で再実行されます。これによりHTMLでバインドしている箇所も自動で更新されます。

```html
<template>
  <div>{{ reversedMessage }}</div>
</template>

<script lang="ts">
  @Component()
  export default class ExampleView extends VueComponent {
    private message: string = '';

    // 算出プロパティ
    private get reversedMessage() {
      return this.message.split('').reverse().join('');
    }
  }
</script>
```

算出プロパティは他の算出プロパティを参照することもできます。

```ts
private get doubleReversedMessage() {
  // 算出プロパティの中で他の算出プロパティを参照
  return this.reversedMessage.split('').reverse().join('');
}
```


## Watch

`@Watch`に**変数パス**を指定することで変数、算出プロパティ、オブジェクトのいずれかのプロパティまたは特定プロパティの変更、を監視することができます。

次はインスタンス変数の変更を監視しています。

```ts
@Component()
export default class ExampleView extends VueComponent {
  private message: string = '';

  @Watch('message')
  private messageOnChange(newValue: string, oldValue: string): void {
    …
  }
}
```

次は算出プロパティの変更を監視しています。

```ts
@Component()
export default class ExampleView extends VueComponent {
  private get reversedMessage() {
    …
  }

  @Watch('reversedMessage')
  private reversedMessageOnChange(newValue: string, oldValue: string): void {
    …
  }
}
```

次はオブジェクトのいずれかのプロパティ変更(`title`、`message`など)を監視しています。この場合はオプションの`deep`に`true`を指定します。

```ts
@Component()
export default class ExampleView extends VueComponent {
  private post: Post = {
    title: '',
    message: '',
  };

  @Watch('post', { deep: true })
  private postOnChange(newValue: Post, oldValue: Post): void {
    …
  }
}
```

次はオブジェクトの特定のプロパティ変更(`post.message`)を監視しています。

```ts
@Component()
export default class ExampleView extends VueComponent {
  private post: Post = {
    title: '',
    message: '',
  };

  @Watch('post.message')
  private postMessageOnChange(newValue: string, oldValue: string): void {
    …
  }
}
```


## Event handlers

イベントハンドラは普通のメソッドになります。

```html
<template>
  <button v-on:click="sendButtonOnClick">Send</button>
</template>

<script lang="ts">
  @Component()
  export default class ExampleView extends VueComponent {
    private get sendButtonOnClick(event) {
      console.log(event.target.tagName);
    }
  }
</script>
```

以下は`v-on`の省略記法`@`で上記と同じ意味になります。

```html
<button @click="sendButtonOnClick">Send</button>
```

イベントハンドラには引数をわたすことができます。

```html
<template>
  <template v-for="(product, index) in products">
    <button @click="addButonOnClick(product)">Add</button>
  </template>
</template>

<script lang="ts">
  @Component()
  export default class ExampleView extends VueComponent {
    private get addButonOnClick(product: Product) {
      …
    }
  }
</script>
```

引数に加え、イベントオブジェクトである`$event`もわたすこともできます。

```html
<template>
  <template v-for="(product, index) in products">
    <button @click="addButonOnClick(product, $event)">Add</button>
  </template>
</template>

<script lang="ts">
  @Component()
  export default class ExampleView extends VueComponent {
    private get addButonOnClick(product: Product, event: Event) {
      …
    }
  }
</script>
```


## Lifecycle hooks

Vueには`created`、`mounted`、`updated`、…といったライフサイクルがあり、これらのサイクルをフックできます。フックするにはこれらの名前のメソッドを定義します。この際、**必ずスーパークラスのライフサイクルメソッドを呼び出すようにしてください**。

```ts
@Component()
export default class ExampleView extends VueComponent {
  created() {
    // 必ずスーパークラスのライフサイクルメソッドを呼び出すこと
    supre.created();
    …
  }
}
```


## 他のコンポーネントを使用する

他で作成されたコンポーネントを使用する方法を次に示します。
1. 他のコンポーネントをインポート
2. インポートしたコンポーネントをHTML上でなんというタグ名前で使用するかを設定
3. ｢2｣で設定したタグ名をHTML上で使用する

```html
<template>
  <div>
    <!-- 3. ｢2｣で設定したタグ名でインポートしたコンポーネントを使用 -->
    <greet-message ref="greetMessage"></greet-message>
  </div>
</template>

<script lang="ts">
  // 1. 他のコンポーネントをインポート
  import GreetMessage from './greet-message.vue';

  @Component({
    components: {
      // 2. インポートしたコンポーネントをHTML上でなんというタグ名前で使用するかを設定
      'greet-message': GreetMessage,
    },
  })
  export default class ExampleView extends VueComponent {
    private get greetMessage(): GreetMessage {
      return this.$refs.greetMessage as GreetMessage;
    }

    created() {
      // インポートしたコンポーネントのpublicなメソッドやプロパティは
      // コード補完で表示され、アクセスすることができる。
      this.greetMessage.greet();
    }
  }
</script>
```





