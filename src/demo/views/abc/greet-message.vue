<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.title
  @extend %text-subtitle1
  font-weight: map_get($text-weights, "medium")

.value
  @extend %text-subtitle1

.message
  color: var(--greet-message-color, $red-5)
</style>

<template>
  <div class="GreetMessage layout horizontal center">
    <div v-show="state.isSignIn" class="message layout vertical">
      <div>{{ t('abc.hello', { name: state.user.fullName }) }}</div>
      <div>{{ t('abc.today', { date: d(new Date(), 'dateSec') }) }}</div>
    </div>
    <div class="flex-1" />
    <q-btn flat rounded color="primary" :label="state.isSignIn ? t('common.signOut') : t('common.signIn')" @click="signInOrOutButtonOnClick" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from '@vue/composition-api'
import { Dialogs } from '@/app/dialogs'
import Vue from 'vue'
import { injectLogic } from '@/app/logic'
import { useI18n } from '@/demo/i18n'

interface GreetMessage extends Vue, GreetMessage.Props {
  readonly times: number
  greet: () => string
}

namespace GreetMessage {
  export interface Props {
    message: string
  }

  export const clazz = defineComponent({
    name: 'GreetMessage',

    props: {
      message: { type: String, required: true },
    },

    setup(props: Readonly<Props>) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const logic = injectLogic()
      const { t, d } = useI18n()

      const state = reactive({
        isSignIn: logic.auth.isSignedIn,
        user: logic.auth.user,
        times: 0,
      })

      //----------------------------------------------------------------------
      //
      //  Properties
      //
      //----------------------------------------------------------------------

      const times = computed(() => {
        return state.times
      })

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      const greet: GreetMessage['greet'] = () => {
        logic.auth.validateSignedIn()

        const message = `Hi ${state.user.fullName}, ${props.message}.`
        state.times++
        return message
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      const signInOrOutButtonOnClick = async () => {
        if (state.isSignIn) {
          await logic.auth.signOut()
        } else {
          await Dialogs.signIn.open()
        }
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        times,
        greet,
        t,
        d,
        state,
        signInOrOutButtonOnClick,
      }
    },
  })
}

export default GreetMessage.clazz
export { GreetMessage }
</script>
