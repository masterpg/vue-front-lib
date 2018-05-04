# Colors

Vutifyでは[Material Design spec](https://material.io/guidelines/style/color.html)にしたがって色を定義しており、StylusとTypeScriptからこれらの色を指定することができます。


## CSSクラス

カラーのCSSクラスは[ここ](https://github.com/vuetifyjs/vuetify/blob/master/src/stylus/settings/_colors.styl)に定義されています。次に一部を抜粋します。

```css
$red = {
  "base":       #F44336,
  "lighten-5":  #FFEBEE,
  "lighten-4":  #FFCDD2,
  "darken-1":   #E53935,
  "darken-2":   #D32F2F,
  "accent-1":   #FF8A80,
  "accent-2":   #FF5252,
  …
}

$purple = {
  "base":       #9c27b0,
  "lighten-5":  #f3e5f5,
  "lighten-4":  #e1bee7,
  "darken-1":   #8e24aa,
  "darken-2":   #7b1fa2,
  "accent-1":   #ea80fc,
  "accent-2":   #e040fb,
  …
}
```


## 文字色を設定する

テキストの文字色を設定するには`{color-name}--text`をクラス名として指定できます。`{color-name}`の部分にはCSSクラスで示した`$red`や`$purple`の`$`を除いたものを指定します。

例えばテキストを紫色にするには`class`に`purple-text`を指定します。これはCSSクラスの`$purple.base`にあたります。

```html
<div class="purple-text">Purple Text</div>
```

さらに基本色に対して細かい色の指定をするには`text--{sub-color-name}`を指定します。`{sub-color-name}`の部分には`lighten-5`や`darken-1`などを指定します。

```html
<div class="purple-text text--darken-1">Purple Darken-1 Text</div>
```


## 背景色を設定する

背景色もCSSクラスをベースに指定することになります。背景色は`{color-name}`をクラス名として指定できます。`{color-name}`の部分にはCSSクラスで示した`$red`や`$purple`の`$`を除いたものを指定します。

例えば背景を紫色にするには`class`に`purple`を指定します。これはCSSクラスの`$purple.base`にあたります。

```html
<div class="purple">Purple Background</div>
```

さらに基本色に対して細かい色の指定をするには`{sub-color-name}`を指定します。`{sub-color-name}`の部分には`lighten-5`や`darken-1`などを指定します。

```html
<div class="purple darken-1">Purple Darken-1 Background</div>
```


## TypeScriptで色を設定する

VuetifyのカラーパックをインポートすることでTypeScriptで色指定することができます。

```ts
// カラーパックをインポート
import colors from 'vuetify/es5/util/colors'

Vue.use(Vuetify, {
  theme: {
    primary: colors.red.darken1, // #E53935
    secondary: colors.red.lighten4, // #FFCDD2
    accent: colors.indigo.base // #3F51B5
  }
})
```


## Stylusで色を設定する

Vuetifyのカラーパックをインポートすることで.vueファイルで色指定することができます。

```html
<style lang="stylus" scoped>
  @import '~vuetify/src/stylus/settings/_colors'

  div {
    color: $indigo.darken-1;
  }
</style>
```
