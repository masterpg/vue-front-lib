import { VueSelector } from '../../../../../helpers/testcafe'
declare const test: TestFn

fixture`ABC Page`.page`http://localhost:5000/views/demo/abc`

test('メッセージを入力した際に影響がある箇所を検証', async t => {
  const messageInput = VueSelector('abc-page', 'messageInput')
  const messageOut = VueSelector('abc-page', 'messageOut')
  const reversedMessageOut = VueSelector('abc-page', 'reversedMessageOut')
  const doubleReversedMessageOut = VueSelector('abc-page', 'doubleReversedMessageOut')

  await t
    .selectText(messageInput)
    .typeText(messageInput, 'abc')
    .expect(messageOut.textContent)
    .eql('abc')
    .expect(reversedMessageOut.textContent)
    .eql('cba')
    .expect(doubleReversedMessageOut.textContent)
    .eql('abc')
})

test('GREETボタンが押下された場合', async t => {
  const greetButton = VueSelector('abc-page', 'greetButton')
  const greetMessage = VueSelector('abc-page', 'greetMessage')

  await t.setNativeDialogHandler(() => true).click(greetButton)

  const history = await t.getNativeDialogHistory()

  await t
    .expect(history[0].type)
    .eql('alert')
    .expect((greetMessage as any).getFieldValue('m_greetTimes'))
    .eql(1)
})

test('SLEEPボタンが押下された場合', async t => {
  const sleepButton = VueSelector('abc-page', 'sleepButton')

  await t
    .setNativeDialogHandler((type, text, url) => {
      const expectedText = 'I slept for 1000ms.'
      if (text !== expectedText) {
        throw `AssertionError: expected '${expectedText}' to deeply equal '${text}'`
      }
    })
    .click(sleepButton)
    .wait(1000)

  const history = await t.getNativeDialogHistory()
  await t.expect(history[0].type).eql('alert')
})

test('POSTボタンが押下された場合', async t => {
  const abcPage = VueSelector('abc-page')
  const messageInput = VueSelector('abc-page', 'messageInput')
  const postButton = VueSelector('abc-page', 'postButton')

  await t
    .selectText(messageInput)
    .typeText(messageInput, 'abc')
    .click(postButton)
    .expect(
      abcPage.getFieldValue('m_post', ({ message, times }) => {
        return { message, times }
      })
    )
    .eql({ message: 'abc', times: 1 })
})
