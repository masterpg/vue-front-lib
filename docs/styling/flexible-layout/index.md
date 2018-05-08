# Flexible Layout

* [概要](#overview)
* [HorizontalレイアウトとVerticalレイアウト](#horizontal-and-vertical-layout)
  * [デフォルトで適用される幅と高さ](#default-width-and-height)
  * [Main-axis と Cross-axis](#main-and-cross-axis)
* [子エレメントのサイズをフレキシブルに制御する](#flexible-children)
* [Cross-axisにエレメントを配置](#cross-axis-alignment)
* [Main-axisにエレメントを配置](#justification)
* [自身のエレメントの配置設定](#self-alignment)
* [折り返しレイアウト](#wrapping-layouts)
* [リバースレイアウト](#reversed-layouts)
* [汎用的なルール](#general-purpose-rules)

<br>


## <div id="overview">概要</div>

本プロジェクトでは[CSS flexible box](https://developer.mozilla.org/ja/docs/Web/Guide/CSS/Flexible_boxes)をシンプルに利用するためのCSSクラスを用意しました。以降このCSSクラスの使い方について説明していきます。

<br>


## <div id="horizontal-and-vertical-layout">HorizontalレイアウトとVerticalレイアウト</div>
次は最もシンプルな横方向と縦方向のレイアウトのサンプルです。

```html
<div class="layout horizontal">
  <div>One</div>
  <div>Two</div>
  <div>Three</div>
</div>

<div class="layout vertical">
  <div>One</div>
  <div>Two</div>
  <div>Three</div>
</div>
```

![](./images/horizontal-and-vertical.png)

<br>


### <div id="default-width-and-height">デフォルトで適用される幅と高さ</div>
ここではまずHorizontalまたはVerticalレイアウトで、デフォルトで適用される幅と高さについて見ていきましょう。次のサンプルでは、`<body>`に3つの`<div>`がコンテナとして配置されています。

* 1つ目の`<div>`は子エレメントを1つ持ちます。
* 2つ目の`<div>`は子エレメントを持ちません。
* 3つ目の`<div>`は子エレメントを1つ持ち、また高さが指定されています。

```html
<style scoped>
  .container {
    margin: 10px;
    padding: 5px;
    background-color: lightgray;
  }
  .item {
    background-color: white;
    margin: 5px;
    padding: 10px;
  }
</style>

<template>
  <div>
    <!-- このコンテナは子エレメントを持つ -->
    <div class="layout vertical container">
      <div class="item">One</div>
    </div>
    <!-- このコンテナは子エレメントを持たない -->
    <div class="layout vertical container"></div>
    <!-- このコンテナは子エレメント持ち、高さが指定されている -->
    <div class="layout vertical container" style="height: 150px;">
      <div class="item">One</div>
    </div>
  </div>
</template>
```

まず`<div>`の幅ですが、3つとも親エレメント(ここではコンポーネント)の幅の中で可能な範囲でストレッチされています。またブラウザをリサイズしても`<div>`の幅は適切に追従します。

次に`<div>`の高さですが、1つ目の`<div>`は子エレメントの高さから計算して親である`<div>`の高さが決定されています。2つ目の`<div>`は子エレメントを持たないため、親である`<div>`がペタンコになっています。3つ目の`<div>`は指定された高さが適用されています。

![](./images/default-container-size.png)


**レイアウトを行う際は次のことを頭に置いておくと良いでしょう**:

* 幅が指定されないコンテナでは、親コンテナの中で可能な範囲で幅がストレッチされる。
* 高さが指定されないコンテナでは、子エレメントの高さを基準にしてコンテナの高さが決定される。
* 高さが指定されたコンテナでは、子エレメントの高さよりコンテナに指定された高さが優先される。

<br>


### <div id="main-and-cross-axis">Main-axis と Cross-axis</div>

コンテナは2つの軸を持っています。<term>Main-axis</term> (<term>主軸</term>) は、指定したコンテナに適用した`layout horizontal`や`layout vertical`がこれにあたります。これに対して<term>Cross-axis</term> (<term>交差軸</term>) は、Main-axisに対して垂直な軸となり、Main-axisがHorizontalの場合、Cross-axisはVerticalになります。

**デフォルトでは、子エレメントのサイズはCross-axis方向へストレッチされます**:

```html
<div class="layout horizontal" style="height: 150px;">
  <div>Stretch Fill</div>
  <div>Stretch Fill</div>
</div>

<div class="layout vertical" style="height: 150px;">
  <div>Stretch Fill</div>
  <div>Stretch Fill</div>
</div>
```

**レイアウトを行う際は次のことを頭に置いておくと良いでしょう**:

* Main-axisがHorizontalの場合、子エレメントは縦方向へストレッチします:
![](./images/horizontal-stretch.png)

* Main-axisがVerticalの場合、子エレメントは横方向へストレッチします:
![](./images/vertical-stretch.png)

<br>


## <div id="flexible-children">子エレメントのサイズをフレキシブルに制御する</div>

コンテナの子エレメントは、<term>flex</term>を使用することで自身のサイズを制御することができます。

```html
<div class="layout horizontal">
  <div>One</div>
  <div class="flex">Two (flex)</div>
  <div>Three</div>
</div>
```

![](./images/horizontal-flex.png)

<br>

---

Horizontalと同様にVerticalでもエレメントのサイズが柔軟に変化します。**ただしVerticalレイアウトではコンテナの`height`に値を指定する必要あります**。指定しない場合はレイアウトが崩れる場合があります:

```html
<div class="layout vertical" style="height: 250px;">
  <div>Alpha</div>
  <div class="flex">Beta (flex)</div>
  <div>Gamma</div>
</div>
```

![](./images/vertical-flex-1.png)

次は`height`に値をしなかった場合にレイアウトが崩れた例です:

![](./images/vertical-flex-2.png)

> Note: レイアウトの崩れですが、ブラウザやそのバージョンによっても挙動が異なるようです。

<br>

---

子エレメントのサイズは割合を指定することができます。割合は`flex-2`のように、数字の部分を1〜12の範囲で指定します (`flex`は`flex-1`と同意) :

```html
<div class="layout horizontal">
  <div class="flex-2">Alpha</div>
  <div class="flex">Beta</div>
  <div class="flex-3">Gamma</div>
</div>
```

![](./images/horizontal-flex-ratio.png)

---

<br>

ここではコンテナに子エレメントをフィットさせています。フィットさせるためには以下の性質を利用します:

* 幅のフィットは、<term>flex</term>を指定することによって行う。
* 高さのフィットは、Main-axisがHorizontalの場合に子エレメントが縦方向へストレッチする性質を利用する (詳細は「[Main-axis と Cross-axis](#main-and-cross-axis)」を参照ください) 。

```html
<div class="layout horizontal" style="height: 150px;">
  <div class="flex">Fit</div>
</div>
```

![](./images/horizontal-fit.png)

<br>


## <div id="cross-axis-alignment">Cross-axisにエレメントを配置</div>

ここではCross-axisにエレメントを配置する方法についてみていきます。

<br>
次のサンプルでは、Cross-axis (Vertical) のstart位置にエレメントを配置しています:

```html
<div class="layout horizontal start" style="height: 150px;">
  <div>start</div>
  <div>start</div>
</div>
```

![](./images/horizontal-start.png)

---

<br>

次のサンプルでは、Cross-axis (Vertical) のcenter位置にエレメントを配置しています:

```html
<div class="layout horizontal center" style="height: 150px;">
  <div>center</div>
  <div>center</div>
</div>
```

![](./images/horizontal-center.png)

---

<br>

次のサンプルでは、Cross-axis (Vertical) のend位置にエレメントを配置しています:

```html
<div class="layout horizontal end" style="height: 150px;">
  <div>end</div>
  <div>end</div>
</div>
```

![](./images/horizontal-end.png)

---

<br>

次のサンプルでは、上下左右中央にエレメントを配置しています:

```html
<div class="layout horizontal center-center" style="height: 150px;">
  <div>center-center</div>
  <div>center-center</div>
</div>
```

![](./images/horizontal-center-center.png)

<br>


## <div id="justification">Main-axisにエレメントを配置</div>
ここではMain-axisにエレメントを配置する方法についてみていきます。

> Note: ここでのサンプルでは、Main-axis (Horizontal) に子エレメントを配置する際、子エレメントが縦方向へストレッチしています。この理由については「[Main-axis と Cross-axis](#main-and-cross-axis)」を参照ください) 。


<br>
次のサンプルでは、Main-axis (Horizontal) のstart位置に子エレメントを配置しています:

```html
<div class="layout horizontal start-justified" style="height: 100px;">
  <div>start-justified</div>
</div>
```

![](./images/horizontal-start-justified.png)

---

<br>

次のサンプルでは、Main-axis (Horizontal) のcenter位置に子エレメントを配置しています:

```html
<div class="layout horizontal center-justified" style="height: 100px;">
  <div>center-justified</div>
</div>
```

![](./images/horizontal-center-justified.png)

---

<br>

次のサンプルでは、Main-axis (Horizontal) のend位置に子エレメントを配置しています:

```html
<div class="layout horizontal end-justified" style="height: 100px;">
  <div>end-justified</div>
</div>
```

![](./images/horizontal-end-justified.png)

---

<br>

次のサンプルでは、Main-axis (Horizontal) のエレメントとエレメント間のスペースが均等になります:

```html
<div class="layout horizontal justified" style="height: 100px;">
  <div>justified</div>
  <div>justified</div>
  <div>justified</div>
</div>
```

![](./images/horizontal-justified.png)

---

<br>

次のサンプルでは、Main-axis (Horizontal) のエレメントの周りのスペースが均等になります:

```html
<div class="layout horizontal around-justified" style="height: 100px;">
  <div>around-justified</div>
  <div>around-justified</div>
</div>
```

![](./images/horizontal-around-justified.png)

<br>


## <div id="self-alignment">自身のエレメントの配置設定</div>

「[Cross-axisにエレメントを配置](#cross-axis-alignment)」ではコンテナに`start`や`center`などを適用し、子エレメントの配置をしていました。ここでは子エレメントに直接`self-start`や`self-center`などを適用して子エレメントの配置を行います:

```html
<div class="layout horizontal justified" style="height: 150px;">
  <div class="flex self-start">Alpha</div>
  <div class="flex self-center">Beta</div>
  <div class="flex self-end">Gamma</div>
  <div class="flex self-stretch">Delta</div>
</div>
```

![](./images/horizontal-self.png)

<br>


## <div id="wrapping-layouts">折り返しレイアウト</div>
ここでは収まりきらないエレメントを折り返します。

```html
<div class="layout horizontal wrap" style="width: 250px;">
  <div>Alpha</div>
  <div>Beta</div>
  <div>Gamma</div>
  <div>Delta</div>
</div>
```

![](./images/horizontal-wrap.png)

<br>


## <div id="reversed-layouts">リバースレイアウト</div>
ここでは通常とは逆方向にエレメントを配置します。以下はそのクラスの一覧です:

* layout horizontal‑reverse
* layout verical‑reverse
* layout wrap‑reverse

```html
<div class="layout horizontal-reverse">
  <div>Alpha</div>
  <div>Beta</div>
  <div>Gamma</div>
  <div>Delta</div>
</div>
```

![](./images/horizontal-reverse.png)

<br>


## <div id="general-purpose-rules">汎用的なルール</div>

次のような汎用的なルールも提供されます:

| クラス | 内容 |
|:---|:---|
| block | display: block |
| invisible | visibility: hidden |
| relative | position: relative |
| fit | コンテナに子エレメントをフィットさせる |

> Note: `fit`を使用する場合は、祖先でエレメントのサイズが決められてかつ`position: relative`の必要があります。


```html
<div class="layout vertical">
  <div>Before <span>[A Span]</span> After</div>
  <div>Before <span class="block">[A Block Span]</span> After</div>
  <div>Before <span class="invisible">[A Invisible Span]</span> After</div>
  <div class="relative" style="height: 100px;">
    <div class="fit" style="background-color: black; color: white">Fit</div>
  </div>
</div>
```

![](./images/general-purpose-rules.png)
