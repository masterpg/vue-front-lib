# Typography

本プロジェクトでは Material Design spec Roboto Font を使用し、以下の CSS クラスを定義しています。

## CSS クラス

`src/assets/styles/_typography.styl`には次の CSS クラスが定義されています。

| Scale Category                                                                  | Class              | Size  | Weight |
| :------------------------------------------------------------------------------ | :----------------- | :---- | :----- |
| <div class="app-font-display4" style="color: var(--app-grey-600);">H1</div>     | .app-font-display4 | 112px | 300    |
| <div class="app-font-display3" style="color: var(--app-grey-600);">H2</div>     | .app-font-display3 | 56px  | 400    |
| <div class="app-font-display2" style="color: var(--app-grey-600);">H3</div>     | .app-font-display2 | 45px  | 400    |
| <div class="app-font-display1" style="color: var(--app-grey-600);">H4</div>     | .app-font-display1 | 34px  | 400    |
| <div class="app-font-headline" style="color: var(--app-grey-600);">H5</div>     | .app-font-headline | 24px  | 400    |
| <div class="app-font-title" style="color: var(--app-grey-600);">H6</div>        | .app-font-title    | 20px  | 500    |
| <div class="app-font-subhead" style="color: var(--app-grey-600);">Subhead</div> | .app-font-subhead  | 16px  | 400    |
| <div class="app-font-code2" style="color: var(--app-grey-600);">Code 2</div>    | .app-font-code2    | 14px  | 700    |
| <div class="app-font-code1" style="color: var(--app-grey-600);">Code 1</div>    | .app-font-code1    | 14px  | 500    |
| <div class="app-font-button" style="color: var(--app-grey-600);">Button</div>   | .app-font-button   | 14px  | 500    |
| <div class="app-font-body2" style="color: var(--app-grey-600);">Body 2</div>    | .app-font-body2    | 14px  | 500    |
| <div class="app-font-body1" style="color: var(--app-grey-600);">Body 1</div>    | .app-font-body1    | 14px  | 400    |
| <div class="app-font-menu" style="color: var(--app-grey-600);">Menu</div>       | .app-font-menu     | 13px  | 500    |
| <div class="app-font-caption" style="color: var(--app-grey-600);">Caption</div> | .app-font-caption  | 12px  | 400    |

## CSS クラス利用例

次は .vue ファイルの HTML 要素に直接フォントの CSS クラスを適用する例です。

```html
<template>
  <div>
    <p class="app-font-body1">Hello</p>
  </div>
</template>
```

<br>

次は .vue ファイルで定義した CSS クラスにフォントの CSS クラスを継承させて利用する例です。

```html
<style lang="stylus" scoped>
  @import '../assets/styles/_typography.styl';
  .title {
    @extend .app-font-title;
    color: var(--app-grey-600);
  }
</style>

<template>
  <div>
    <h6 class="title">Welcome</h6>
  </div>
</template>
```

ここでは Stylus の機能を利用してフォントクラスを継承させています。

まず`@import`で`_typography.styl`ファイルをインポートし、フォントの CSS クラスを読み込みます。これにより`<style>`タグの中でフォント CSS クラスが利用できるようになるので、`@extend`で継承して定義されたフォントを利用しています。
