import { MarkdownItVueComponent, getMarkdownItVueComponentBodyData, getMarkdownItVueComponentPropsData } from '@/markdown-it'
import MarkdownIt from 'markdown-it'
import { TestCompBlock } from './test-comp-block.vue'
import { TestCompCommon } from './test-comp-common.vue'
import { TestCompInline } from './test-comp-inline.vue'
import { join } from 'path'
import { mount } from '@vue/test-utils'
import testgen from 'markdown-it-testgen'

//========================================================================
//
//  Tests
//
//========================================================================

describe('インライン/ブロック - 共通', () => {
  mount(TestCompCommon.clazz)
  const md = new MarkdownIt({ breaks: false }).use(MarkdownItVueComponent, {
    components: { TestCompCommon: TestCompCommon.clazz },
  })

  testgen(join(__dirname, 'fixtures/common.txt'), { header: true }, md)
})

describe('インライン/ブロック - ｢breaks: false｣の場合', () => {
  mount(TestCompInline.clazz)
  mount(TestCompBlock.clazz)
  const md = new MarkdownIt({ breaks: false }).use(MarkdownItVueComponent, {
    components: { TestCompInline: TestCompInline.clazz, TestCompBlock: TestCompBlock.clazz },
  })

  testgen(join(__dirname, 'fixtures/inline.txt'), { header: true }, md)
  testgen(join(__dirname, 'fixtures/block-breaks-false.txt'), { header: true }, md)
})

describe('インライン/ブロック - ｢breaks: true｣の場合', () => {
  mount(TestCompInline.clazz)
  mount(TestCompBlock.clazz)
  const md = new MarkdownIt({ breaks: true }).use(MarkdownItVueComponent, {
    components: { TestCompInline: TestCompInline.clazz, TestCompBlock: TestCompBlock.clazz },
  })

  testgen(join(__dirname, 'fixtures/inline.txt'), { header: true }, md)
  testgen(join(__dirname, 'fixtures/block-breaks-true.txt'), { header: true }, md)
})

describe('getMarkdownItVueComponentBodyData', () => {
  it('ベーシックケース', () => {
    const vueSrc = `@vue.TestCompCommon({ person: "{ "name": "Taro", "age": 18 }", flag: true })`
    const src = `${vueSrc}`

    const actual = getMarkdownItVueComponentBodyData(src)!

    expect(actual.fullMatch).toBe(vueSrc)
    expect(actual.component).toBe(`TestCompCommon`)
    expect(actual.props).toBe(`person: "{ "name": "Taro", "age": 18 }", flag: true`)
    expect(actual.index).toBe(0)
  })

  it('できるだけスペースを詰めた場合', () => {
    const vueSrc = `@vue.TestCompCommon({flag:true})`
    const src = `${vueSrc}`

    const actual = getMarkdownItVueComponentBodyData(src)!

    expect(actual.fullMatch).toBe(vueSrc)
    expect(actual.component).toBe(`TestCompCommon`)
    expect(actual.props).toBe(`flag:true`)
    expect(actual.index).toBe(0)
  })

  it('できるだけスペースをあけた場合', () => {
    const vueSrc = `@vue.TestCompCommon({ flag : true })`
    const src = `   ${vueSrc}   `

    const actual = getMarkdownItVueComponentBodyData(src)!

    expect(actual.fullMatch).toBe(vueSrc)
    expect(actual.component).toBe(`TestCompCommon`)
    expect(actual.props).toBe(`flag : true`)
    expect(actual.index).toBe(3)
  })

  it('インライン入力の場合', () => {
    const vueSrc = `@vue.TestCompCommon({ flag: true })`
    const src = `AAA${vueSrc}BBB`

    const actual = getMarkdownItVueComponentBodyData(src)!

    expect(actual.fullMatch).toBe(vueSrc)
    expect(actual.component).toBe(`TestCompCommon`)
    expect(actual.props).toBe(`flag: true`)
    expect(actual.index).toBe(3)
  })

  it('誤ったフォーマットでVueコンポーネントを指定した場合', () => {
    // '('と'{'の間にスペースを入れる(誤ったフォーマット)
    const vueSrc = `@vue.TestCompCommon( { flag: true } )`
    const src = `${vueSrc}`

    const actual = getMarkdownItVueComponentBodyData(src)

    expect(actual).toBeUndefined()
  })
})

describe('getMarkdownItVueComponentPropsData', () => {
  describe('共通', () => {
    it('共通フォーマット誤り - 1', () => {
      // プロパティ名のみの場合
      const rawProps = `aaa`

      const actual = getMarkdownItVueComponentPropsData(rawProps)

      expect(actual).toEqual({})
    })

    it('共通フォーマット誤り - 2', () => {
      // コロンをつけ忘れた場合
      const rawProps = `flag true`

      const actual = getMarkdownItVueComponentPropsData(rawProps)

      expect(actual).toEqual({})
    })

    it('JSONフォーマット誤り - 1', () => {
      // person右に｢:｣をつけ忘れた場合
      const rawProps = `person "{ "name": "Taro" }"`

      const actual = getMarkdownItVueComponentPropsData(rawProps)

      expect(actual).toEqual({})
    })

    it('JSONフォーマット誤り - 2', () => {
      // プロパティ名に｢"｣をつけ忘れた場合
      const rawProps = `person: "{ name: "Taro" }"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)

      expect(Object.keys(actual)[0]).toBe('person')

      expect(actual.person).toBeUndefined()
    })

    it('JSONフォーマット誤り - 3', () => {
      // プロパティの値に｢"｣をつけ忘れた場合
      const rawProps = `person: "{ "name": Taro }"`

      const actual = getMarkdownItVueComponentPropsData(rawProps)

      expect(Object.keys(actual)[0]).toBe('person')
      expect(actual.person).toBeUndefined()
    })
  })

  describe('JSON', () => {
    it('オブジェクト1 - ベーシックケース', () => {
      const rawProps = `person: "{ "name": "Taro", "age": 18 }"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.person).toEqual({ name: 'Taro', age: 18 })
    })

    it('オブジェクト2 - 空オブジェクトを指定した', () => {
      const rawProps = `person: "{}"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.person).toEqual({})
    })

    it('オブジェクト3 - できるだけスペースを詰めた場合', () => {
      const rawProps = `person:"{"name":"Taro","age":18}"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.person).toEqual({ name: 'Taro', age: 18 })
    })

    it('オブジェクト4 - できるだけスペースをあけた場合', () => {
      const rawProps = ` person : " { "name" : "Taro" , "age" : 18 } " `
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.person).toEqual({ name: 'Taro', age: 18 })
    })

    it('配列1 - ベーシックケース', () => {
      const rawProps = `arr: "["aaa", "bbb"]"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.arr).toEqual(['aaa', 'bbb'])
    })

    it('配列2 - 空配列を指定した場合', () => {
      const rawProps = `arr: "[]"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.arr).toEqual([])
    })

    it('配列3 - できるだけスペースを詰めた場合', () => {
      const rawProps = `arr:"["aaa","bbb"]"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.arr).toEqual(['aaa', 'bbb'])
    })

    it('配列4 - できるだけスペースをあけた場合', () => {
      const rawProps = ` arr : " [ "aaa" , "bbb" ] " `
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.arr).toEqual(['aaa', 'bbb'])
    })

    it('総合', () => {
      const person1 = `person1: "{ "name": "Taro", "age": 18 }"`
      const person2 = `person2: "{}"`
      const person3 = `person3:"{"name":"Taro","age":18}"`
      const person4 = ` person4 : " { "name" : "Taro" , "age" : 18 } " `
      const arr1 = `arr1: "["aaa", "bbb"]"`
      const arr2 = `arr2: "[]"`
      const arr3 = `arr3:"["aaa","bbb"]"`
      const arr4 = ` arr4 : " [ "aaa" , "bbb" ] " `

      const rawProps = `${person1}, prop1: "one", ${person2}, prop2: "two", ${person3}, prop3: "three", ${person4}, prop4: "four", ${arr1}, prop5: "five", ${arr2}, prop6: "six", ${arr3}, prop7: "seven", ${arr4}, prop8: "eight"`

      const actual = getMarkdownItVueComponentPropsData(rawProps)

      expect(actual.person1).toEqual({ name: 'Taro', age: 18 })
      expect(actual.person2).toEqual({})
      expect(actual.person3).toEqual({ name: 'Taro', age: 18 })
      expect(actual.person4).toEqual({ name: 'Taro', age: 18 })
      expect(actual.arr1).toEqual(['aaa', 'bbb'])
      expect(actual.arr2).toEqual([])
      expect(actual.arr3).toEqual(['aaa', 'bbb'])
      expect(actual.arr4).toEqual(['aaa', 'bbb'])
      expect(actual.prop1).toBe('one')
      expect(actual.prop2).toBe('two')
      expect(actual.prop3).toBe('three')
      expect(actual.prop4).toBe('four')
      expect(actual.prop5).toBe('five')
      expect(actual.prop6).toBe('six')
      expect(actual.prop7).toBe('seven')
      expect(actual.prop8).toBe('eight')
    })
  })

  describe('プリミティブ', () => {
    it('String - ベーシックケース', () => {
      const rawProps = `str1: "aaa"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.str1).toEqual(`aaa`)
    })

    it('String - ｢"｣を含んだ場合', () => {
      const rawProps = `str2: "a"b"c"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.str2).toEqual(`a"b"c`)
    })

    it('Boolean - trueの場合', () => {
      const rawProps = `bool1: true`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.bool1).toBeTruthy()
    })

    it('Boolean - falseの場合', () => {
      const rawProps = `bool2: false`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.bool2).toBeFalsy()
    })

    it('Number - 整数の場合', () => {
      const rawProps = `num1: 99`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.num1).toBe(99)
    })

    it('Number - 少数の場合', () => {
      const rawProps = `num2: 99.99`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.num2).toBe(99.99)
    })

    it('できるだけスペースをあけた場合', () => {
      const rawProps = ` oth1 : "aaa" , oth2 : "bbb" `
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.oth1).toEqual(`aaa`)
      expect(actual.oth2).toEqual(`bbb`)
    })

    it('できるだけスペースを詰めた場合', () => {
      const rawProps = `oth3:"aaa",oth4:"bbb"`
      const actual = getMarkdownItVueComponentPropsData(rawProps)
      expect(actual.oth3).toEqual(`aaa`)
      expect(actual.oth4).toEqual(`bbb`)
    })

    it('総合', () => {
      const str1 = `str1: "aaa"`
      const str2 = `str2: "a"b"c"`
      const bool1 = `bool1: true`
      const bool2 = `bool2: false`
      const num1 = `num1: 99`
      const num2 = `num2: 99.99`
      const oth1_2 = ` oth1 : "aaa" , oth2 : "bbb" `
      const oth3_4 = `oth3:"aaa",oth4:"bbb"`

      const rawProps = `${str1}, ${str2}, ${bool1}, ${bool2}, ${num1}, ${num2}, ${oth1_2}, ${oth3_4}`

      const actual = getMarkdownItVueComponentPropsData(rawProps)

      expect(actual.str1).toEqual(`aaa`)
      expect(actual.str2).toEqual(`a"b"c`)
      expect(actual.bool1).toBeTruthy()
      expect(actual.bool2).toBeFalsy()
      expect(actual.num1).toBe(99)
      expect(actual.num2).toBe(99.99)
      expect(actual.oth1).toEqual(`aaa`)
      expect(actual.oth2).toEqual(`bbb`)
      expect(actual.oth3).toEqual(`aaa`)
      expect(actual.oth4).toEqual(`bbb`)
    })
  })
})
