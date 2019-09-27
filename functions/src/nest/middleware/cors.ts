import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { CORSService } from '../../services/base'

@Injectable()
export class CORSMiddleware implements NestMiddleware {
  constructor(@Inject(CORSService) protected readonly corsService: CORSService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.corsService.validate(req, res, next)
  }
}
