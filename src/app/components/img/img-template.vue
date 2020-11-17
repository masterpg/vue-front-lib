<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.Img
  box-sizing: border-box
  position: relative

.img-tag
  max-width: var(--img-max-width, 100%)
  max-height: var(--img-max-height, 100%)

.spinner-container
  width: 100%
  height: 100%
  top: 0
  left: 0
  position: absolute

  .spinner
    position: relative
    display: inline-block
    width: 20px
    height: 20px
    border: 2px solid #0cf
    border-radius: 50%
    animation: spin 0.75s infinite linear

  .spinner::before,
  .spinner::after
    left: -2px
    top: -2px
    display: none
    position: absolute
    content: ''
    width: inherit
    height: inherit
    border: inherit
    border-radius: inherit

  .spinner-type-one,
  .spinner-type-one::before
    display: inline-block
    border-color: transparent
    border-top-color: $grey-6

  .spinner-type-one::before
    animation: spin 1.5s infinite ease

@keyframes spin
  from
    transform: rotate(0deg)
  to
    transform: rotate(360deg)
</style>

<template>
  <div ref="container" class="Img layout horizontal">
    <div ref="spinnerContainer" class="spinner-container layout vertical center-center" hidden>
      <div style="height: 20px"><div class="spinner spinner-type-one" /></div>
    </div>
    <img ref="img" :src="inputSrc" :alt="alt" h-align="center" class="img-tag" @load="imgOnLoad" />
  </div>
</template>
