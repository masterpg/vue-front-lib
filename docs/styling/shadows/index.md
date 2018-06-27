# Shadows

## CSS クラス

`src/assets/styles/_shadow.styl`には次の CSS クラスが定義されています。

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

## CSS クラス利用例

次は .vue ファイルで定義した CSS クラスにシャドウの CSS クラスを継承させて利用する例です。

```html
<style lang="stylus" scoped>
  @import '../assets/styles/_shadows.styl';
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

ここでは Stylus の機能を利用してシャドウクラスを継承させています。

まず`@import`で`_shadow.styl`ファイルをインポートし、シャドウの CSS クラスを読み込みます。これにより`<style>`タグの中でシャドウ CSS クラスが利用できるようになるので、`@extend`で継承して定義されたシャドウを利用しています。
