# Shadows

## CSSクラス

`src/assets/styles/_shadow.styl`には次のCSSクラスが定義されています。

##### .app-shadow-elevation-2dp
<div class="shadow-tag app-shadow-elevation-2dp"></div>

##### .app-shadow-elevation-3dp
<div class="shadow-tag app-shadow-elevation-3dp"></div>

##### .app-shadow-elevation-4dp
<div class="shadow-tag app-shadow-elevation-4dp"></div>

##### .app-shadow-elevation-6dp
<div class="shadow-tag app-shadow-elevation-6dp"></div>

##### .app-shadow-elevation-8dp
<div class="shadow-tag app-shadow-elevation-8dp"></div>

##### .app-shadow-elevation-12dp
<div class="shadow-tag app-shadow-elevation-12dp"></div>

##### .app-shadow-elevation-16dp
<div class="shadow-tag app-shadow-elevation-16dp"></div>

##### .app-shadow-elevation-24dp
<div class="shadow-tag app-shadow-elevation-24dp"></div>

<br>

## CSSクラス利用例

次は.vueファイルで定義したCSSクラスにシャドウのCSSクラスを継承させて利用する例です。

```html
<style lang="stylus" scoped>
  @import '../assets/styles/_shadow.styl'
  .container {
    @extend .app-shadow-elevation-3dp;
  }
</style>

<template>
  <div class="container">
    …
  </div>
</template>
```

ここではStylusの機能を利用してシャドウクラスを継承させています。

まず`@import`で`_shadow.styl`ファイルをインポートし、シャドウのCSSクラスを読み込みます。これにより`<style>`タグの中でシャドウCSSクラスが利用できるようになるので、`@extend`で継承して定義されたシャドウを利用しています。
