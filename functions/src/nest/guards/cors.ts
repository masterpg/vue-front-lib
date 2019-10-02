import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { CORSService } from '../../services/base'
import { getAllExecutionContext } from '../utils'

@Injectable()
export class CORSGuard implements CanActivate {
  constructor(@Inject(CORSService) protected readonly corsService: CORSService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allContext = getAllExecutionContext(context)
    return this.corsService.validate(allContext)
  }
}

export const corsGuardProvider = {
  provide: APP_GUARD,
  useClass: CORSGuard,
}
