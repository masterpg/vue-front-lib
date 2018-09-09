# Colors

本プロジェクトでは [Material Design spec](https://material.io/guidelines/style/color.html) にしたがって CSS 変数で色を定義しており、この変数を利用して色を設定することができます。

## 色を設定する

本プロジェクトでは[カラーパレット](#color-palettes)で示す色を CSS 変数で定義しています。

以下は .vue ファイルで色指定する例です。

```html
<style lang="postcss" scoped>
  div {
    color: var(--app-red-50);
  }
</style>
```

## <div id="color-palettes">カラーパレット</div>

`src/assets/styles/_colors.pcss`には次の色が CSS 変数で定義されています。

<div class="layout horizontal start" style="margin-top: 40px;">
  <div>
    <div class="color-tag red-50-background"><div>--app-red-50</div></div>
    <div class="color-tag red-100-background"><div>--app-red-100</div></div>
    <div class="color-tag red-200-background"><div>--app-red-200</div></div>
    <div class="color-tag red-300-background"><div>--app-red-300</div></div>
    <div class="color-tag red-400-background"><div>--app-red-400</div></div>
    <div class="color-tag red-500-background"><div>--app-red-500</div></div>
    <div class="color-tag red-600-background"><div>--app-red-600</div></div>
    <div class="color-tag red-700-background"><div>--app-red-700</div></div>
    <div class="color-tag red-800-background"><div>--app-red-800</div></div>
    <div class="color-tag red-900-background"><div>--app-red-900</div></div>
    <div class="color-tag red-a100-background"><div>--app-red-a100</div></div>
    <div class="color-tag red-a200-background"><div>--app-red-a200</div></div>
    <div class="color-tag red-a400-background"><div>--app-red-a400</div></div>
    <div class="color-tag red-a700-background"><div>--app-red-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag pink-50-background"><div>--app-pink-50</div></div>
    <div class="color-tag pink-100-background"><div>--app-pink-100</div></div>
    <div class="color-tag pink-200-background"><div>--app-pink-200</div></div>
    <div class="color-tag pink-300-background"><div>--app-pink-300</div></div>
    <div class="color-tag pink-400-background"><div>--app-pink-400</div></div>
    <div class="color-tag pink-500-background"><div>--app-pink-500</div></div>
    <div class="color-tag pink-600-background"><div>--app-pink-600</div></div>
    <div class="color-tag pink-700-background"><div>--app-pink-700</div></div>
    <div class="color-tag pink-800-background"><div>--app-pink-800</div></div>
    <div class="color-tag pink-900-background"><div>--app-pink-900</div></div>
    <div class="color-tag pink-a100-background"><div>--app-pink-a100</div></div>
    <div class="color-tag pink-a200-background"><div>--app-pink-a200</div></div>
    <div class="color-tag pink-a400-background"><div>--app-pink-a400</div></div>
    <div class="color-tag pink-a700-background"><div>--app-pink-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag purple-50-background"><div>--app-purple-50</div></div>
    <div class="color-tag purple-100-background"><div>--app-purple-100</div></div>
    <div class="color-tag purple-200-background"><div>--app-purple-200</div></div>
    <div class="color-tag purple-300-background"><div>--app-purple-300</div></div>
    <div class="color-tag purple-400-background"><div>--app-purple-400</div></div>
    <div class="color-tag purple-500-background"><div>--app-purple-500</div></div>
    <div class="color-tag purple-600-background"><div>--app-purple-600</div></div>
    <div class="color-tag purple-700-background"><div>--app-purple-700</div></div>
    <div class="color-tag purple-800-background"><div>--app-purple-800</div></div>
    <div class="color-tag purple-900-background"><div>--app-purple-900</div></div>
    <div class="color-tag purple-a100-background"><div>--app-purple-a100</div></div>
    <div class="color-tag purple-a200-background"><div>--app-purple-a200</div></div>
    <div class="color-tag purple-a400-background"><div>--app-purple-a400</div></div>
    <div class="color-tag purple-a700-background"><div>--app-purple-a700</div></div>
  </div>
</div>

<div class="layout horizontal start" style="margin-top: 40px;">
  <div>
    <div class="color-tag deep-purple-50-background"><div>--app-deep-purple-50</div></div>
    <div class="color-tag deep-purple-100-background"><div>--app-deep-purple-100</div></div>
    <div class="color-tag deep-purple-200-background"><div>--app-deep-purple-200</div></div>
    <div class="color-tag deep-purple-300-background"><div>--app-deep-purple-300</div></div>
    <div class="color-tag deep-purple-400-background"><div>--app-deep-purple-400</div></div>
    <div class="color-tag deep-purple-500-background"><div>--app-deep-purple-500</div></div>
    <div class="color-tag deep-purple-600-background"><div>--app-deep-purple-600</div></div>
    <div class="color-tag deep-purple-700-background"><div>--app-deep-purple-700</div></div>
    <div class="color-tag deep-purple-800-background"><div>--app-deep-purple-800</div></div>
    <div class="color-tag deep-purple-900-background"><div>--app-deep-purple-900</div></div>
    <div class="color-tag deep-purple-a100-background"><div>--app-deep-purple-a100</div></div>
    <div class="color-tag deep-purple-a200-background"><div>--app-deep-purple-a200</div></div>
    <div class="color-tag deep-purple-a400-background"><div>--app-deep-purple-a400</div></div>
    <div class="color-tag deep-purple-a700-background"><div>--app-deep-purple-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag indigo-50-background"><div>--app-indigo-50</div></div>
    <div class="color-tag indigo-100-background"><div>--app-indigo-100</div></div>
    <div class="color-tag indigo-200-background"><div>--app-indigo-200</div></div>
    <div class="color-tag indigo-300-background"><div>--app-indigo-300</div></div>
    <div class="color-tag indigo-400-background"><div>--app-indigo-400</div></div>
    <div class="color-tag indigo-500-background"><div>--app-indigo-500</div></div>
    <div class="color-tag indigo-600-background"><div>--app-indigo-600</div></div>
    <div class="color-tag indigo-700-background"><div>--app-indigo-700</div></div>
    <div class="color-tag indigo-800-background"><div>--app-indigo-800</div></div>
    <div class="color-tag indigo-900-background"><div>--app-indigo-900</div></div>
    <div class="color-tag indigo-a100-background"><div>--app-indigo-a100</div></div>
    <div class="color-tag indigo-a200-background"><div>--app-indigo-a200</div></div>
    <div class="color-tag indigo-a400-background"><div>--app-indigo-a400</div></div>
    <div class="color-tag indigo-a700-background"><div>--app-indigo-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag blue-50-background"><div>--app-blue-50</div></div>
    <div class="color-tag blue-100-background"><div>--app-blue-100</div></div>
    <div class="color-tag blue-200-background"><div>--app-blue-200</div></div>
    <div class="color-tag blue-300-background"><div>--app-blue-300</div></div>
    <div class="color-tag blue-400-background"><div>--app-blue-400</div></div>
    <div class="color-tag blue-500-background"><div>--app-blue-500</div></div>
    <div class="color-tag blue-600-background"><div>--app-blue-600</div></div>
    <div class="color-tag blue-700-background"><div>--app-blue-700</div></div>
    <div class="color-tag blue-800-background"><div>--app-blue-800</div></div>
    <div class="color-tag blue-900-background"><div>--app-blue-900</div></div>
    <div class="color-tag blue-a100-background"><div>--app-blue-a100</div></div>
    <div class="color-tag blue-a200-background"><div>--app-blue-a200</div></div>
    <div class="color-tag blue-a400-background"><div>--app-blue-a400</div></div>
    <div class="color-tag blue-a700-background"><div>--app-blue-a700</div></div>
  </div>
</div>

<div class="layout horizontal start" style="margin-top: 40px;">
  <div>
    <div class="color-tag light-blue-50-background"><div>--app-light-blue-50</div></div>
    <div class="color-tag light-blue-100-background"><div>--app-light-blue-100</div></div>
    <div class="color-tag light-blue-200-background"><div>--app-light-blue-200</div></div>
    <div class="color-tag light-blue-300-background"><div>--app-light-blue-300</div></div>
    <div class="color-tag light-blue-400-background"><div>--app-light-blue-400</div></div>
    <div class="color-tag light-blue-500-background"><div>--app-light-blue-500</div></div>
    <div class="color-tag light-blue-600-background"><div>--app-light-blue-600</div></div>
    <div class="color-tag light-blue-700-background"><div>--app-light-blue-700</div></div>
    <div class="color-tag light-blue-800-background"><div>--app-light-blue-800</div></div>
    <div class="color-tag light-blue-900-background"><div>--app-light-blue-900</div></div>
    <div class="color-tag light-blue-a100-background"><div>--app-light-blue-a100</div></div>
    <div class="color-tag light-blue-a200-background"><div>--app-light-blue-a200</div></div>
    <div class="color-tag light-blue-a400-background"><div>--app-light-blue-a400</div></div>
    <div class="color-tag light-blue-a700-background"><div>--app-light-blue-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag cyan-50-background"><div>--app-cyan-50</div></div>
    <div class="color-tag cyan-100-background"><div>--app-cyan-100</div></div>
    <div class="color-tag cyan-200-background"><div>--app-cyan-200</div></div>
    <div class="color-tag cyan-300-background"><div>--app-cyan-300</div></div>
    <div class="color-tag cyan-400-background"><div>--app-cyan-400</div></div>
    <div class="color-tag cyan-500-background"><div>--app-cyan-500</div></div>
    <div class="color-tag cyan-600-background"><div>--app-cyan-600</div></div>
    <div class="color-tag cyan-700-background"><div>--app-cyan-700</div></div>
    <div class="color-tag cyan-800-background"><div>--app-cyan-800</div></div>
    <div class="color-tag cyan-900-background"><div>--app-cyan-900</div></div>
    <div class="color-tag cyan-a100-background"><div>--app-cyan-a100</div></div>
    <div class="color-tag cyan-a200-background"><div>--app-cyan-a200</div></div>
    <div class="color-tag cyan-a400-background"><div>--app-cyan-a400</div></div>
    <div class="color-tag cyan-a700-background"><div>--app-cyan-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag teal-50-background"><div>--app-teal-50</div></div>
    <div class="color-tag teal-100-background"><div>--app-teal-100</div></div>
    <div class="color-tag teal-200-background"><div>--app-teal-200</div></div>
    <div class="color-tag teal-300-background"><div>--app-teal-300</div></div>
    <div class="color-tag teal-400-background"><div>--app-teal-400</div></div>
    <div class="color-tag teal-500-background"><div>--app-teal-500</div></div>
    <div class="color-tag teal-600-background"><div>--app-teal-600</div></div>
    <div class="color-tag teal-700-background"><div>--app-teal-700</div></div>
    <div class="color-tag teal-800-background"><div>--app-teal-800</div></div>
    <div class="color-tag teal-900-background"><div>--app-teal-900</div></div>
    <div class="color-tag teal-a100-background"><div>--app-teal-a100</div></div>
    <div class="color-tag teal-a200-background"><div>--app-teal-a200</div></div>
    <div class="color-tag teal-a400-background"><div>--app-teal-a400</div></div>
    <div class="color-tag teal-a700-background"><div>--app-teal-a700</div></div>
  </div>
</div>

<div class="layout horizontal start" style="margin-top: 40px;">
  <div>
    <div class="color-tag green-50-background"><div>--app-green-50</div></div>
    <div class="color-tag green-100-background"><div>--app-green-100</div></div>
    <div class="color-tag green-200-background"><div>--app-green-200</div></div>
    <div class="color-tag green-300-background"><div>--app-green-300</div></div>
    <div class="color-tag green-400-background"><div>--app-green-400</div></div>
    <div class="color-tag green-500-background"><div>--app-green-500</div></div>
    <div class="color-tag green-600-background"><div>--app-green-600</div></div>
    <div class="color-tag green-700-background"><div>--app-green-700</div></div>
    <div class="color-tag green-800-background"><div>--app-green-800</div></div>
    <div class="color-tag green-900-background"><div>--app-green-900</div></div>
    <div class="color-tag green-a100-background"><div>--app-green-a100</div></div>
    <div class="color-tag green-a200-background"><div>--app-green-a200</div></div>
    <div class="color-tag green-a400-background"><div>--app-green-a400</div></div>
    <div class="color-tag green-a700-background"><div>--app-green-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag light-green-50-background"><div>--app-light-green-50</div></div>
    <div class="color-tag light-green-100-background"><div>--app-light-green-100</div></div>
    <div class="color-tag light-green-200-background"><div>--app-light-green-200</div></div>
    <div class="color-tag light-green-300-background"><div>--app-light-green-300</div></div>
    <div class="color-tag light-green-400-background"><div>--app-light-green-400</div></div>
    <div class="color-tag light-green-500-background"><div>--app-light-green-500</div></div>
    <div class="color-tag light-green-600-background"><div>--app-light-green-600</div></div>
    <div class="color-tag light-green-700-background"><div>--app-light-green-700</div></div>
    <div class="color-tag light-green-800-background"><div>--app-light-green-800</div></div>
    <div class="color-tag light-green-900-background"><div>--app-light-green-900</div></div>
    <div class="color-tag light-green-a100-background"><div>--app-light-green-a100</div></div>
    <div class="color-tag light-green-a200-background"><div>--app-light-green-a200</div></div>
    <div class="color-tag light-green-a400-background"><div>--app-light-green-a400</div></div>
    <div class="color-tag light-green-a700-background"><div>--app-light-green-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag lime-50-background"><div>--app-lime-50</div></div>
    <div class="color-tag lime-100-background"><div>--app-lime-100</div></div>
    <div class="color-tag lime-200-background"><div>--app-lime-200</div></div>
    <div class="color-tag lime-300-background"><div>--app-lime-300</div></div>
    <div class="color-tag lime-400-background"><div>--app-lime-400</div></div>
    <div class="color-tag lime-500-background"><div>--app-lime-500</div></div>
    <div class="color-tag lime-600-background"><div>--app-lime-600</div></div>
    <div class="color-tag lime-700-background"><div>--app-lime-700</div></div>
    <div class="color-tag lime-800-background"><div>--app-lime-800</div></div>
    <div class="color-tag lime-900-background"><div>--app-lime-900</div></div>
    <div class="color-tag lime-a100-background"><div>--app-lime-a100</div></div>
    <div class="color-tag lime-a200-background"><div>--app-lime-a200</div></div>
    <div class="color-tag lime-a400-background"><div>--app-lime-a400</div></div>
    <div class="color-tag lime-a700-background"><div>--app-lime-a700</div></div>
  </div>
</div>

<div class="layout horizontal start" style="margin-top: 40px;">
  <div>
    <div class="color-tag yellow-50-background"><div>--app-yellow-50</div></div>
    <div class="color-tag yellow-100-background"><div>--app-yellow-100</div></div>
    <div class="color-tag yellow-200-background"><div>--app-yellow-200</div></div>
    <div class="color-tag yellow-300-background"><div>--app-yellow-300</div></div>
    <div class="color-tag yellow-400-background"><div>--app-yellow-400</div></div>
    <div class="color-tag yellow-500-background"><div>--app-yellow-500</div></div>
    <div class="color-tag yellow-600-background"><div>--app-yellow-600</div></div>
    <div class="color-tag yellow-700-background"><div>--app-yellow-700</div></div>
    <div class="color-tag yellow-800-background"><div>--app-yellow-800</div></div>
    <div class="color-tag yellow-900-background"><div>--app-yellow-900</div></div>
    <div class="color-tag yellow-a100-background"><div>--app-yellow-a100</div></div>
    <div class="color-tag yellow-a200-background"><div>--app-yellow-a200</div></div>
    <div class="color-tag yellow-a400-background"><div>--app-yellow-a400</div></div>
    <div class="color-tag yellow-a700-background"><div>--app-yellow-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag amber-50-background"><div>--app-amber-50</div></div>
    <div class="color-tag amber-100-background"><div>--app-amber-100</div></div>
    <div class="color-tag amber-200-background"><div>--app-amber-200</div></div>
    <div class="color-tag amber-300-background"><div>--app-amber-300</div></div>
    <div class="color-tag amber-400-background"><div>--app-amber-400</div></div>
    <div class="color-tag amber-500-background"><div>--app-amber-500</div></div>
    <div class="color-tag amber-600-background"><div>--app-amber-600</div></div>
    <div class="color-tag amber-700-background"><div>--app-amber-700</div></div>
    <div class="color-tag amber-800-background"><div>--app-amber-800</div></div>
    <div class="color-tag amber-900-background"><div>--app-amber-900</div></div>
    <div class="color-tag amber-a100-background"><div>--app-amber-a100</div></div>
    <div class="color-tag amber-a200-background"><div>--app-amber-a200</div></div>
    <div class="color-tag amber-a400-background"><div>--app-amber-a400</div></div>
    <div class="color-tag amber-a700-background"><div>--app-amber-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag orange-50-background"><div>--app-orange-50</div></div>
    <div class="color-tag orange-100-background"><div>--app-orange-100</div></div>
    <div class="color-tag orange-200-background"><div>--app-orange-200</div></div>
    <div class="color-tag orange-300-background"><div>--app-orange-300</div></div>
    <div class="color-tag orange-400-background"><div>--app-orange-400</div></div>
    <div class="color-tag orange-500-background"><div>--app-orange-500</div></div>
    <div class="color-tag orange-600-background"><div>--app-orange-600</div></div>
    <div class="color-tag orange-700-background"><div>--app-orange-700</div></div>
    <div class="color-tag orange-800-background"><div>--app-orange-800</div></div>
    <div class="color-tag orange-900-background"><div>--app-orange-900</div></div>
    <div class="color-tag orange-a100-background"><div>--app-orange-a100</div></div>
    <div class="color-tag orange-a200-background"><div>--app-orange-a200</div></div>
    <div class="color-tag orange-a400-background"><div>--app-orange-a400</div></div>
    <div class="color-tag orange-a700-background"><div>--app-orange-a700</div></div>
  </div>
</div>

<div class="layout horizontal start" style="margin-top: 40px;">
  <div>
    <div class="color-tag deep-orange-50-background"><div>--app-deep-orange-50</div></div>
    <div class="color-tag deep-orange-100-background"><div>--app-deep-orange-100</div></div>
    <div class="color-tag deep-orange-200-background"><div>--app-deep-orange-200</div></div>
    <div class="color-tag deep-orange-300-background"><div>--app-deep-orange-300</div></div>
    <div class="color-tag deep-orange-400-background"><div>--app-deep-orange-400</div></div>
    <div class="color-tag deep-orange-500-background"><div>--app-deep-orange-500</div></div>
    <div class="color-tag deep-orange-600-background"><div>--app-deep-orange-600</div></div>
    <div class="color-tag deep-orange-700-background"><div>--app-deep-orange-700</div></div>
    <div class="color-tag deep-orange-800-background"><div>--app-deep-orange-800</div></div>
    <div class="color-tag deep-orange-900-background"><div>--app-deep-orange-900</div></div>
    <div class="color-tag deep-orange-a100-background"><div>--app-deep-orange-a100</div></div>
    <div class="color-tag deep-orange-a200-background"><div>--app-deep-orange-a200</div></div>
    <div class="color-tag deep-orange-a400-background"><div>--app-deep-orange-a400</div></div>
    <div class="color-tag deep-orange-a700-background"><div>--app-deep-orange-a700</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag brown-50-background"><div>--app-brown-50</div></div>
    <div class="color-tag brown-100-background"><div>--app-brown-100</div></div>
    <div class="color-tag brown-200-background"><div>--app-brown-200</div></div>
    <div class="color-tag brown-300-background"><div>--app-brown-300</div></div>
    <div class="color-tag brown-400-background"><div>--app-brown-400</div></div>
    <div class="color-tag brown-500-background"><div>--app-brown-500</div></div>
    <div class="color-tag brown-600-background"><div>--app-brown-600</div></div>
    <div class="color-tag brown-700-background"><div>--app-brown-700</div></div>
    <div class="color-tag brown-800-background"><div>--app-brown-800</div></div>
    <div class="color-tag brown-900-background"><div>--app-brown-900</div></div>
  </div>
  <div style="margin-left: 40px;">
    <div class="color-tag grey-50-background"><div>--app-grey-50</div></div>
    <div class="color-tag grey-100-background"><div>--app-grey-100</div></div>
    <div class="color-tag grey-200-background"><div>--app-grey-200</div></div>
    <div class="color-tag grey-300-background"><div>--app-grey-300</div></div>
    <div class="color-tag grey-400-background"><div>--app-grey-400</div></div>
    <div class="color-tag grey-500-background"><div>--app-grey-500</div></div>
    <div class="color-tag grey-600-background"><div>--app-grey-600</div></div>
    <div class="color-tag grey-700-background"><div>--app-grey-700</div></div>
    <div class="color-tag grey-800-background"><div>--app-grey-800</div></div>
    <div class="color-tag grey-900-background"><div>--app-grey-900</div></div>
  </div>
</div>

<div class="layout horizontal start" style="margin-top: 40px;">
  <div>
    <div class="color-tag blue-grey-50-background"><div>--app-blue-grey-50</div></div>
    <div class="color-tag blue-grey-100-background"><div>--app-blue-grey-100</div></div>
    <div class="color-tag blue-grey-200-background"><div>--app-blue-grey-200</div></div>
    <div class="color-tag blue-grey-300-background"><div>--app-blue-grey-300</div></div>
    <div class="color-tag blue-grey-400-background"><div>--app-blue-grey-400</div></div>
    <div class="color-tag blue-grey-500-background"><div>--app-blue-grey-500</div></div>
    <div class="color-tag blue-grey-600-background"><div>--app-blue-grey-600</div></div>
    <div class="color-tag blue-grey-700-background"><div>--app-blue-grey-700</div></div>
    <div class="color-tag blue-grey-800-background"><div>--app-blue-grey-800</div></div>
    <div class="color-tag blue-grey-900-background"><div>--app-blue-grey-900</div></div>
  </div>
</div>
