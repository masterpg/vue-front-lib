import { ValidatorOptions, validate } from 'class-validator'
import { ArgumentValidationError } from 'type-graphql'
const assign = require('lodash/assign')
const cloneDeep = require('lodash/cloneDeep')

type Constructor<T = any> = new (...args: any[]) => T

export async function validateArray(objectClass: Constructor, objects: any[], validatorOptions?: ValidatorOptions): Promise<void> {
  for (const item of objects) {
    const object = assign(new objectClass(), cloneDeep(item))
    const validated = await validate(object)
    if (validated.length > 0) {
      throw new ArgumentValidationError(validated)
    }
  }
}
