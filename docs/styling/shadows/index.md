# Shadows

## CSS クラス

`src/assets/styles/_shadow.pcss`には次の CSS クラスが定義されています。

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

次は .vue ファイルで定義した CSS クラスにシャドウのプレースホルダーを継承して利用する例です。

```html
<style lang="postcss" scoped>
  @import '../assets/styles/shadows.pcss';
  .container {
    @extend %app-shadow-elevation-3dp;
  }
</style>

<template>
  <div class="container">…</div>
</template>
```

ここでは PostCSS の機能を利用してプレースホルダーを継承しています。

まず`@import`で`shadow.pcss`ファイルをインポートし、シャドウのプレースホルダーを読み込みます。これにより`<style>`タグの中でシャドウのプレースホルダーが利用できるようになるので、`@extend`で継承して定義されたシャドウを利用しています。
