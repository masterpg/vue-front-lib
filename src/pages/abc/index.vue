<style scoped>
@import '../../styles/placeholder/typography.css';
.greet-message {
  --greet-message-color: var(--comm-indigo-a200);
}

.title {
  @extend %comm-font-subhead1;
  font-weight: 500;
}

.value {
  @extend %comm-font-subhead1;
}
</style>

<template>
  <div class="layout vertical">
    <q-card class="comm-pa-12" :class="{ 'comm-ma-48': pcScreen, 'comm-ma-24': tabScreen, 'comm-ma-12': spScreen }">
      <div class="comm-my-16">{{ $t('hello', { today: $d(new Date(), 'short') }) }}</div>
      <q-input ref="messageInput" data-e2e-id="messageInput" v-model="m_message" label="Input Message" />
      <div class="comm-my-16">
        <span class="title">propA: </span><span class="value">{{ propA }}</span>
      </div>
      <div class="comm-my-16">
        <span class="title">propB: </span><span class="value">{{ propB }}</span>
      </div>
      <div class="comm-my-16">
        <span class="title">message: </span><span data-e2e-id="messageOut" class="value">{{ m_message }}</span>
      </div>
      <div class="comm-my-16">
        <span class="title">custom propA: </span><span class="value">{{ m_customPropA }}</span>
      </div>
      <div class="comm-my-16">
        <span class="title">reversed message: </span><span data-e2e-id="reversedMessageOut" class="value">{{ m_reversedMessage }}</span>
      </div>
      <div class="comm-my-16">
        <span class="title">double reversed message: </span>
        <span data-e2e-id="doubleReversedMessageOut" class="value">{{ m_doubleReversedMessage }}</span>
      </div>
      <div class="layout horizontal center comm-my-16">
        <greet-message ref="greetMessage" data-e2e-id="greetMessage" :message="m_message" class="greet-message"></greet-message>
        <q-btn data-e2e-id="greetButton" flat rounded color="primary" label="Greet" class="comm-ml-12" @click="m_greetButtonOnClick" />
      </div>
      <div class="comm-my-16">
        <span class="title">post times: </span><span class="value">{{ m_post.times }}</span>
        <q-btn data-e2e-id="postButton" flat rounded color="primary" label="Post" class="comm-ml-12" @click="m_postButtonOnClick" />
      </div>
      <div class="layout horizontal center comm-my-16">
        <custom-input v-model="m_customInputValue" class="flex-3"></custom-input>
        <span class="flex-9 comm-ml-12">
          <span class="title">value: </span><span class="value">{{ m_customInputValue }}</span>
        </span>
      </div>
      <div class="layout horizontal center comm-my-16">
        <custom-checkbox v-model="m_customChecked"></custom-checkbox>
        <span class="comm-ml-12">
          <span class="title" ref="aaa">checked: </span><span class="value">{{ m_customChecked }}</span>
        </span>
      </div>
      <div class="layout horizontal end-justified">
        <q-btn data-e2e-id="sleepButton" label="Sleep" color="primary" @click="m_sleepButtonOnClick" />
      </div>
    </q-card>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from 'vue-property-decorator'
import { BaseComponent } from '@/base/component'
import CustomCheckbox from '@/pages/abc/custom-checkbox.vue'
import CustomInput from '@/pages/abc/custom-input.vue'
import GreetMessage from '@/pages/abc/greet-message.vue'
import { mixins } from 'vue-class-component'

interface Post {
  message: string
  times: number
}

@Component({
  name: 'abc-page',
  components: {
    'greet-message': GreetMessage,
    'custom-checkbox': CustomCheckbox,
    'custom-input': CustomInput,
  },
})
export default class ABCPage extends mixins(BaseComponent) {
  //--------------------------------------------------
  //  props
  //--------------------------------------------------

  // propの初期化は@Propのdefaultで行う

  @Prop({ default: 'prop value A' })
  propA!: string

  @Prop({ default: 'prop value B' })
  propB!: string

  //--------------------------------------------------
  //  data
  //--------------------------------------------------

  // dataは初期化が必要！

  private m_message: string = ''

  private m_customInputValue: string = 'hoge'

  private m_customChecked: boolean = false

  // propの値を初期化に利用できる
  private m_customPropA: string = 'custom ' + this.propA

  private m_post: Post = {
    message: '',
    times: 0,
  }

  //--------------------------------------------------
  //  computed
  //--------------------------------------------------

  private get m_reversedMessage() {
    return this.m_message
      .split('')
      .reverse()
      .join('')
  }

  private get m_doubleReversedMessage() {
    return this.m_reversedMessage
      .split('')
      .reverse()
      .join('')
  }

  //--------------------------------------------------
  //  watch
  //--------------------------------------------------

  @Watch('m_message')
  private m_messageOnChange(newValue: string, oldValue: string): void {
    console.log(`m_messageOnChange: newValue: "${newValue}", oldValue: "${oldValue}"`)
  }

  @Watch('m_reversedMessage')
  private m_reversedMessageOnChange(newValue: string, oldValue: string): void {
    console.log(`m_reversedMessageOnChange: newValue: "${newValue}", oldValue: "${oldValue}"`)
  }

  @Watch('m_post', { deep: true })
  private m_postOnChange(newValue: Post, oldValue: Post): void {
    console.log('m_postOnChange: newValue:', newValue, ', oldValue:', oldValue)
  }

  @Watch('m_post.times')
  private m_postTimesOnChange(newValue: string, oldValue: string): void {
    console.log('m_postTimesOnChange: newValue:', newValue, ', oldValue:', oldValue)
  }

  //--------------------------------------------------
  //  lifecycle hooks
  //--------------------------------------------------

  mounted() {
    this.m_message = 'mounted'
  }

  //--------------------------------------------------
  //  internal methods
  //--------------------------------------------------

  private async m_sleep(ms: number): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`I slept for ${ms}ms.`)
      }, ms)
    }) as Promise<string>
  }

  //--------------------------------------------------
  //  event handlers
  //--------------------------------------------------

  private m_greetButtonOnClick() {
    this.m_greetMessage.greet()
  }

  private m_postButtonOnClick() {
    this.m_post.message = this.m_message
    this.m_post.times++
  }

  private async m_sleepButtonOnClick() {
    alert(await this.m_sleep(1000))
  }

  //--------------------------------------------------
  //  elements
  //--------------------------------------------------

  private get m_greetMessage(): GreetMessage {
    return this.$refs.greetMessage as GreetMessage
  }
}
</script>

<i18n>
en:
  hello: "Hello World! Today is {today}."
ja:
  hello: "こんにちは、世界！ 今日は {today} です。"
</i18n>
