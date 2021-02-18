import { ServiceContainer, User } from '@/app/service'
import VGreetMessage, { GreetMessage } from '@/demo/views/abc/greet-message.vue'
import { AuthService } from '@/app/service/modules/auth'
import { computed } from '@vue/composition-api'
import { provideDependencyToVue } from '../../../../helpers/demo'
import { shallowMount } from '@vue/test-utils'

describe('GreetMessage', () => {
  it('template', () => {
    const userName = 'Taro'
    const message = 'abcdefg'

    const wrapper = shallowMount<GreetMessage>(VGreetMessage, {
      propsData: { message },
      setup() {
        provideDependencyToVue(({ service }) => {
          td.replace<AuthService, 'signInStatus'>(
            service.auth,
            'signInStatus',
            computed(() => 'SignedIn')
          )
          td.replace<User, 'fullName'>(service.auth.user, 'fullName', userName)
        })
      },
    })

    expect(wrapper.text()).toMatch(`Hi ${userName}!`)
    expect(wrapper.text()).toMatch(/Today is \d\d\/\d\d\/\d\d, \d\d:\d\d:\d\d (?:AM|PM)\./)
  })

  it('greet', () => {
    const userName = 'Taro'
    const message = 'abcdefg'

    const wrapper = shallowMount<GreetMessage & { service: ServiceContainer }>(VGreetMessage, {
      propsData: { message },
      setup() {
        const { service } = provideDependencyToVue(({ service }) => {
          td.replace<AuthService, 'validateSignedIn'>(service.auth, 'validateSignedIn')
          td.replace<User, 'fullName'>(service.auth.user, 'fullName', userName)
        })
        return { service }
      },
    })
    const { service, ...greetMessage } = wrapper.vm

    // テスト対象実行
    const actual = greetMessage.greet()

    // 戻り値の検証
    expect(actual).toBe(`Hi ${userName}, ${message}.`)

    // validateSignedInの呼び出しを検証
    const exp = td.explain(service.auth.validateSignedIn)
    expect(exp.calls.length).toBe(1) // 1回呼び出されるはず
    expect(exp.calls[0].args[0]).toBeUndefined() // 1回目の呼び出しが引数なしなはず
  })
})
