import { SetupContext } from '@vue/composition-api'

interface Props {
  title: string
}

interface HelloWorld extends Vue, Props {
  hello(): string
}

function setup(props: Readonly<Props>, context: SetupContext) {
  const hello: HelloWorld['hello'] = () => {
    return `Hello World! ${props.title}.`
  }

  return {
    hello,
  }
}

export { HelloWorld, setup }
