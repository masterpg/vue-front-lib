<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.AbcPage
  padding: 12px
  body.screen--lg &, body.screen--xl &
    margin: 48px
  body.screen--md &
    margin: 24px
  body.screen--xs &, body.screen--sm &
    margin: 12px

.greet-message
  --greet-message-color: #{$indigo-8}

.custom-input
  width: 200px

.space-x
  width: 20px

.title
  @extend %text-subtitle1
  font-weight: map_get($text-weights, "medium")

.value
  @extend %text-subtitle1
</style>

<template>
  <q-card class="AbcPage">
    <GreetMessage ref="greetMessage" class="greet-message app-my-16" :message="state.message" />
    <q-input v-model="state.message" label="Input Message" />
    <div class="app-my-16">
      <span class="title">propA: </span><span class="value">{{ propA }}</span>
    </div>
    <div class="app-my-16">
      <span class="title">propB: </span><span class="value">{{ propB }}</span>
    </div>
    <div class="app-my-16">
      <span class="title">Message: </span><span class="value">{{ state.message }}</span>
    </div>
    <div class="app-my-16">
      <span class="title">Reversed Message: </span><span class="value">{{ reversedMessage }}</span>
    </div>
    <div class="app-my-16">
      <span class="title">Double Reversed Message: </span>
      <span class="value">{{ doubleReversedYourName }}</span>
    </div>
    <div class="app-my-16">
      <span class="title">Greet Times: </span><span class="value">{{ greetTimes }}</span>
      <q-btn flat rounded color="primary" label="Greet" class="app-ml-12" :disable="!isSignIn" @click="greetButtonOnClick" />
    </div>
    <div class="app-my-16">
      <span class="title">Post Times: </span><span class="value">{{ state.post.times }}</span>
      <q-btn flat rounded color="primary" label="Post" class="app-ml-12" @click="postButtonOnClick" />
    </div>
    <div class="layout horizontal center app-my-16">
      <q-input class="custom-input" v-model="state.customInputValue" label="AbcPage Value" dense />
      <span class="space-x" />
      <CustomInput v-model="state.customInputValue" class="flex-3" />
    </div>
    <div class="layout horizontal center app-my-16">
      <div class="layout horizontal center">
        <span class="app-mr-4">AbcPage:</span>
        <input type="checkbox" v-model="state.customChecked" />
      </div>
      <span class="space-x" />
      <CustomCheckbox v-model="state.customChecked" />
    </div>
  </q-card>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch, watchEffect } from '@vue/composition-api'
import { CustomCheckbox } from '@/demo/views/abc/custom-checkbox.vue'
import { CustomInput } from '@/demo/views/abc/custom-input.vue'
import { GreetMessage } from '@/demo/views/abc/greet-message.vue'
import { injectLogic } from '@/app/logic'
import { useI18n } from '@/demo/i18n'

interface Post {
  message: string
  times: number
}

namespace AbcPage {
  export interface Props {
    propA: string
    propB: string
  }

  export const clazz = defineComponent({
    name: 'AbcPage',

    components: {
      GreetMessage: GreetMessage.clazz,
      CustomInput: CustomInput.clazz,
      CustomCheckbox: CustomCheckbox.clazz,
    },

    props: {
      propA: { type: String, default: 'prop value A' },
      propB: { type: String, default: 'prop value B' },
    },

    setup(props: Readonly<Props>, context) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        state.message = 'onMounted'
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const logic = injectLogic()
      const { t } = useI18n()

      const greetMessage = ref<GreetMessage>()

      const state = reactive({
        message: '',
        post: {
          message: '',
          times: 0,
        } as Post,
        customInputValue: '',
        customChecked: false,
      })

      const reversedMessage = computed(() =>
        state.message
          .split('')
          .reverse()
          .join('')
      )

      const doubleReversedYourName = computed(() =>
        reversedMessage.value
          .split('')
          .reverse()
          .join('')
      )

      const isSignIn = logic.auth.isSignedIn

      const greetTimes = computed(() => greetMessage.value?.times)

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      const greetButtonOnClick = () => {
        const message = greetMessage.value!.greet()
        console.log(message)
      }

      const postButtonOnClick = () => {
        state.post.times++
      }

      watchEffect(() => {
        state.post.message = state.message
      })

      watch(
        () => state.post,
        (newValue, oldValue) => {
          console.log(
            `Changed post:\n  oldValue: { message: "${newValue.message}", times: ${newValue.times} }\n  newValue: { message: "${newValue.message}", times: ${newValue.times} }`
          )
        },
        { deep: true }
      )

      watch(
        () => state.post.times,
        (newValue, oldValue) => {
          console.log('Changed post.times:\n  oldValue:', oldValue, '\n  newValue:', newValue)
        }
      )

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        t,
        state,
        greetMessage,
        reversedMessage,
        doubleReversedYourName,
        isSignIn,
        greetTimes,
        greetButtonOnClick,
        postButtonOnClick,
      }
    },
  })
}

export default AbcPage.clazz
</script>
