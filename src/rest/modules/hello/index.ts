import { BaseAPI } from '@/rest/base'
import Component from 'vue-class-component'
import { HelloAPI } from '@/rest/types'

@Component
export class HelloAPIImpl extends BaseAPI implements HelloAPI {
  async publicHello(message: string): Promise<string> {
    const response = await this.get<string>('public/hello', {
      params: { message },
    })
    return response.data
  }

  async siteHello(message: string): Promise<string> {
    const response = await this.get<string>('site/hello', {
      params: { message },
    })
    return response.data
  }

  async authHello(message: string, idToken: string): Promise<string> {
    const response = await this.get<string>('auth/hello', {
      headers: { Authorization: `Bearer ${idToken}` },
      params: { message },
    })
    return response.data
  }
}
