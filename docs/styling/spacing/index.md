# Spacing

Vutifyが定義した0〜5の範囲のサイズで要素にマージンまたはパディングを設定することができます。各サイズは一般的なMaterial Designの間隔に合わせて設計されています。

## CSSクラス

**margin**または**padding**は`{property}{direction}-{size}`のフォーマットにしたがったクラスを指定することで設定できます。

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

以下Vuitifyが指定するStylusの変数`$spacer`を基準にサイズを規定しています。

* `0` - `margin` or `padding` に `0` を設定
* `1` - `margin` or `padding` に `$spacer * 0.25` を設定
* `2` - `margin` or `padding` に `$spacer * 0.5` を設定
* `3` - `margin` or `padding` に `$spacer` を設定
* `4` - `margin` or `padding` に `$spacer * 1.5` を設定
* `5` - `margin` or `padding` に `$spacer * 3` を設定


## CSSクラス指定例

`padding-top`にサイズ`1`を指定
```html
<div class="pt-1">hello</div>
```

`margin-left`と`margin-right`にサイズ`3`を指定
```html
<div class="mx-3">hello</div>
```

`margin`の全方向(`top`, `right`, `bottom`, `left`)にサイズ`5`を指定
```html
<div class="ma-5">hello</div>
```

