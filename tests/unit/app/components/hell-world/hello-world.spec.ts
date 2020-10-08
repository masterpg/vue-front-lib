import VHelloWorld, { HelloWorld } from '@/app/components/hello-world'
import { mount, shallowMount } from '@vue/test-utils'

describe('HelloWorld', () => {
  describe('template', () => {
    it('title', () => {
      const title = 'new title'
      const wrapper = mount(VHelloWorld, {
        propsData: { title },
      })

      expect(wrapper.text()).toMatch(title)
    })
  })

  it('hello', () => {
    const title = 'Unit Test'
    const wrapper = mount<HelloWorld>(VHelloWorld, {
      propsData: { title },
    })
    const helloWorld = wrapper.vm

    const actual = helloWorld.hello()

    expect(actual).toMatch('Hello World! Unit Test.')
  })
})
