<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.GreetMessage

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
      <div>{{ t('abc.hello', { name: state.user.publicProfile.displayName }) }}</div>
      <div>{{ t('abc.today', { date: d(new Date(), 'dateSec') }) }}</div>
    </div>
    <div class="flex-1" />
    <q-btn flat rounded color="primary" :label="state.isSignIn ? t('common.signOut') : t('common.signIn')" @click="signInOrOutButtonOnClick" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from '@vue/composition-api'
import { injectDialogs } from '@/app/dialogs'
import { injectLogic } from '@/app/logic'
import { useI18n } from '@/demo/i18n'

interface Props {
  message: string
}

interface GreetMessage extends Vue, Readonly<Props> {
  readonly times: number
  greet: () => string
}

namespace GreetMessage {
  export const clazz = defineComponent({
    name: 'GreetMessage',

    props: {
      message: { type: String, required: true },
    },

    setup(props) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const logic = injectLogic()
      const dialogs = injectDialogs()
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

        const message = `Hi ${state.user.publicProfile.displayName}, ${props.message}.`
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
          await dialogs.signIn.open()
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
