import { LogicContainer, User } from '@/app/logic'
import VGreetMessage, { GreetMessage } from '@/app/views/abc/greet-message.vue'
import { mount, shallowMount } from '@vue/test-utils'
import { AuthLogic } from '@/app/logic/modules/auth'
import { computed } from '@vue/composition-api'
import { provideDependencyToVue } from '../../../../helpers/app'

describe('GreetMessage', () => {
  it('template', () => {
    const userName = 'Taro'
    const message = 'abcdefg'

    const wrapper = shallowMount<GreetMessage>(VGreetMessage, {
      propsData: { message },
      setup() {
        provideDependencyToVue(({ logic }) => {
          td.replace<AuthLogic, 'isSignedIn'>(
            logic.auth,
            'isSignedIn',
            computed(() => true)
          )
          td.replace<AuthLogic, 'user'>(logic.auth, 'user', {
            displayName: userName,
          })
        })
      },
    })

    console.log(wrapper.text())
    expect(wrapper.text()).toMatch(`Hi ${userName}!`)
    expect(wrapper.text()).toMatch(/Today is \d\d\/\d\d\/\d\d, \d\d:\d\d:\d\d (?:AM|PM)\./)
  })

  it('greet', () => {
    const userName = 'Taro'
    const message = 'abcdefg'

    const wrapper = shallowMount<GreetMessage & { logic: LogicContainer }>(VGreetMessage, {
      propsData: { message },
      setup() {
        const { logic } = provideDependencyToVue(({ logic }) => {
          td.replace<AuthLogic, 'validateSignedIn'>(logic.auth, 'validateSignedIn')
          td.replace<User, 'displayName'>(logic.auth.user, 'displayName', userName)
        })
        return { logic }
      },
    })
    const { logic, ...greetMessage } = wrapper.vm

    // テスト対象実行
    const actual = greetMessage.greet()

    // 戻り値の検証
    expect(actual).toBe(`Hi ${userName}, ${message}.`)

    // validateSignedInの呼び出しを検証
    const exp = td.explain(logic.auth.validateSignedIn)
    expect(exp.calls.length).toBe(1) // 1回呼び出されるはず
    expect(exp.calls[0].args[0]).toBeUndefined() // 1回目の呼び出しが引数なしなはず
  })
})
