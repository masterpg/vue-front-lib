import { SetupContext } from '@vue/composition-api'

interface Props {
  title: string
}

interface HelloWorld extends Vue, Readonly<Props> {
  hello(): string
}

function setup(props: Props, context: SetupContext) {
  const hello: HelloWorld['hello'] = () => {
    return `Hello World! ${props.title}.`
  }

  return {
    hello,
  }
}

export { HelloWorld, setup }
