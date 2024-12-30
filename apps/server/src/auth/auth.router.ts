import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { AuthSchema, ObjectModelMethodSchema } from '@nicestack/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
  ) { }
  router = this.trpc.router({
    signUp: this.trpc.procedure
      .input(AuthSchema.signUpRequest)
      .mutation(async ({ input }) => {
        const result = await this.authService.signUp(input);
        return result;
      }),
  });
}
