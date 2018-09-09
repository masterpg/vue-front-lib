# コンポーネント

Vue で作成したコンポーネントはパブリックなプロパティやメソッドを提供することで外部とコミュニケーションする経路を限定し、自身をカプセル化します。

スタイリングも同様に、コンポーネントの見た目をカスタマイズできる部分のみ公開するよう経路を限定し、カプセル化しましょう。経路を限定することで外部から意図しないスタイル変更が行われなくなります。

この機能を実現するには [CSS 変数](/styling/css-variables/index.md) を利用します。

## CSS 変数を定義する

コンポーネントのスタイルをカスタマイズできる部分を公開するには、次のファイルに CSS 変数を定義します。

`src/assets/styles/main.pcss`

```css
:root {
  /* greet-message */
  --greet-message-color: #0000ff;
}
```

CSS 変数は接頭辞に`--`を付ける決まりがあります。

変数名はアプリケーションで一意になるようにしましょう。

名前の付け方ですが、`--<コンポーネント名>-<スタイル名>`とするのがよいでしょう。上記の例でいうと、`greet-message`がコンポーネント名で、`color`がスタイル名となります。この名前からは`GreetMessage`コンポーネントの文字色を設定するといった内容が推測できるでしょう。

変数に設定した値(ここでは色)は、コンポーネントのデフォルト値になり、他の場所で変数の値が設定されない限りこの値が適用されます。

## CSS 変数をコンポーネントに適用する

さきほど定義した CSS 変数をコンポーネントに適用しましょう。

`src/app/views/abc-view/greet-message.vue`

```html
<style lang="postcss" scoped>
  div {
    color: var(--greet-message-color);
  }
</style>
```

定義した CSS 変数を適用するには`var()`関数を使用します。

上記では`div`の`color`に CSS 変数`--greet-message-color`で設定された値が適用されます。

また上記では postcss が使用されていますが、sass のような他のプリプロセッサやプレーンな css でも CSS 変数を使用することができます。

## CSS 変数の値を設定する

CSS 変数の値を状況によって切り替えたいことがあるでしょう。

例えば通常の文字色は青色ですが、エラーが発生した場合は赤色に変えるといったケースが考えられます。

以下にこのケースを想定した .vue ファイルでの実装例を示します。

```html
<style lang="postcss" scoped>
  .normal {
    --greet-message-color: blue;
  }
  .error {
    --greet-message-color: red;
  }
</style>

<template>
  <greet-message class="normal" :class="{ error: isError }"></greet-message>
</template>
```

ここでは、通常は`class`に`normal`が適用されますが、エラーが発生して`isError`が`true`になると`error`クラスが適用されるよう実装されています。
