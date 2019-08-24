import * as firebaseAdmin from 'firebase-admin'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { Context } from '../../types'

@Resolver()
export class AppResolver {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  @Query(returns => String)
  @Authorized()
  async customToken(@Ctx() ctx: Context): Promise<string> {
    // 本来はDBからユーザー情報を取得し、必要なプロパティをトークンに設定することになる
    const token = await firebaseAdmin.auth().createCustomToken(ctx.user!.uid, {
      appAdmin: true,
    })
    return token
  }
}
