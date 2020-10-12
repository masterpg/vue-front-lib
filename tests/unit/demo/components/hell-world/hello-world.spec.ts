import VHelloWorld, { HelloWorld } from '@/demo/components/hello-world'
import { shallowMount } from '@vue/test-utils'

describe('HelloWorld', () => {
  describe('template', () => {
    it('title', () => {
      const title = 'new title'
      const wrapper = shallowMount(VHelloWorld, {
        propsData: { title },
      })

      expect(wrapper.text()).toMatch(title)
    })
  })

  it('hello', () => {
    const title = 'Unit Test'
    const wrapper = shallowMount<HelloWorld>(VHelloWorld, {
      propsData: { title },
    })
    const helloWorld = wrapper.vm

    const actual = helloWorld.hello()

    expect(actual).toMatch('Hello World! Unit Test.')
  })
})
