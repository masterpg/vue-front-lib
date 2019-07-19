import 'firebase/auth'
import * as firebase from 'firebase/app'

import { BaseLogic } from '@/logic/base'
import { Component } from 'vue-property-decorator'
import { HelloLogic } from '@/logic/types'
import { api } from '@/api'
const assign = require('lodash/assign')
const cloneDeep = require('lodash/cloneDeep')

@Component
export class HelloLogicImpl extends BaseLogic implements HelloLogic {
  async publicHello(message: string): Promise<string> {
    return await api.hello.publicHello(message)
  }

  async siteHello(message: string): Promise<string> {
    return await api.hello.siteHello(message)
  }

  async authHello(message: string): Promise<string> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) throw new Error('Not signed in.')

    const idToken = await currentUser.getIdToken()
    const options: any = firebase.app().options || {}
    const domain = options.authDomain || ''
    if (!domain) throw new Error('Domain could not be acquired.')

    return await api.hello.authHello(message, idToken)
  }
}
