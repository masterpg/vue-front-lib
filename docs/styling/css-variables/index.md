# CSS変数

本プロジェクトではCSSで共通的に使用する値を[CSS変数](https://developer.mozilla.org/ja/docs/Web/CSS/Using_CSS_variables)として定義しています。ここではCSS変数の定義と使用方法について説明していきます。


## CSS変数の定義と使用方法

`src/assets/styles/_color.styl`にはさまざまな色がCSS変数として定義されています。

```css
:root {
  --app-red-50: #ffebee;
}
```

ここではCSS変数`--app-red-50`に`#ffebee`という色が設定されています。

CSS変数は接頭辞に`--`を付ける決まりがあります。

`:root`にCSS変数を定義するとグローバルにCSS変数が定義されることになり、プロジェクトのどこでもこのCSS変数を利用することができます。

CSS変数は`.vue`、`.css`、`.styl`、`.scss`などさまざまファイルで利用することができます。

以下はCSS変数を利用する例です。

```html
<style lang="stylus" scoped>
  div {
    color: var(--app-red-50);
  }
</style>
```

定義したCSS変数を適用するには`var()`関数を使用します。

上記では`div`の`color`にCSS変数`--app-red-50`で設定された値が適用されます。

また上記ではstylusが使用されていますが、sassのような他のプリプロセッサやプレーンなcssでもCSS変数を使用することができます。


## CSS変数のスコープ

上記では`:root`にCSS変数を定義したことでプロジェクトのどこでも使用できるCSS変数になりましたが、このスコープを狭めることもできます。

次は`a`要素にCSS変数を定義することで、`a`要素以外にはCSS変数が適用されないことを示しています。

```html
<style>
  a {
    --blue-text: blue;
  }
  .blue {
    color: var(--blue-text);
  }
</style>

<!-- テキストが青色になる -->
<a class="blue" href="#" >hello</a>

<!-- テキストが青色にならない -->
<div class="blue">hello</a>
```
