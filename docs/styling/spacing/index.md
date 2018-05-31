# Spacing


## CSSクラス

本プロジェクトで定義した0〜12の範囲のサイズで要素にマージンまたはパディングを設定することができます。

**margin**または**padding**は`app-{property}{direction}-{size}`のフォーマットにしたがったクラスを指定することで設定できます。

`{property}`、`{direction}`、`{size}`で指定する値を以下に示します。

### property

* `m` - `margin`
* `p` - `padding`

### direction

* `t` - `margin-top` or `padding-top`
* `b` - `margin-bottom` or `padding-bottom`
* `l` - `margin-left` or `padding-left`
* `r` - `margin-right` or `padding-right`
* `x` -《`margin-left` and `margin-right`》or《`padding-left` and `padding-right`》
* `y` -《`margin-top` and `margin-bottom`》or《`padding-top` and `padding-bottom`》
* `a` - `margin` or `padding` の全方向(`top` and `right` and `bottom` and `left`)

### size

* `0` - `margin` or `padding` に `0px` を設定
* `1` - `margin` or `padding` に `4px` を設定
* `2` - `margin` or `padding` に `8px` を設定
* `3` - `margin` or `padding` に `12px` を設定
* `4` - `margin` or `padding` に `16px` を設定
* `5` - `margin` or `padding` に `20px` を設定
* `6` - `margin` or `padding` に `24px` を設定
* `7` - `margin` or `padding` に `28px` を設定
* `8` - `margin` or `padding` に `32px` を設定
* `9` - `margin` or `padding` に `36px` を設定
* `10` - `margin` or `padding` に `40px` を設定
* `11` - `margin` or `padding` に `44px` を設定
* `12` - `margin` or `padding` に `48px` を設定


### CSSクラス指定例

上部にサイズ`1`のパディングを指定
```html
<div class="app-pt-1">hello</div>
```

左右にサイズ`3`のマージンを指定
```html
<div class="app-mx-3">hello</div>
```

全方向(`top`, `right`, `bottom`, `left`)にサイズ`5`のマージンを指定
```html
<div class="app-ma-5">hello</div>
```


## CSS変数

プロジェクトで汎用的に利用可能なマージンとパディング用のCSS変数を次に示します。

```css
:root {
  --app-spacer-0; 0px;
  --app-spacer-1; 4px;
  --app-spacer-2; 8px;
  --app-spacer-3; 12px;
  --app-spacer-4; 16px;
  --app-spacer-5; 20px;
  --app-spacer-6; 24px;
  --app-spacer-7; 28px;
  --app-spacer-8; 32px;
  --app-spacer-9; 36px;
  --app-spacer-10; 40px;
  --app-spacer-11; 44px;
  --app-spacer-12; 48px;
}
```

次は上記CSS変数の使用例です。

```html
<style lang="stylus" scoped>
  div {
    margin: 0 var(--app-spacer-3);
  }
</style>
```
