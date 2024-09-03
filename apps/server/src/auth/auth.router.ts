import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { AuthService } from './auth.service';
import { AuthSchema } from '@nicestack/common';

@Injectable()
export class AuthRouter {
    constructor(private readonly trpc: TrpcService, private readonly authService: AuthService) { }

    router = this.trpc.router({
        login: this.trpc.procedure.input(AuthSchema.signInRequset).mutation(({ input }) => {
            return this.authService.signIn(input);
        }),
        signup: this.trpc.procedure.input(AuthSchema.signUpRequest).mutation(({ input }) => {
            return this.authService.signUp(input);
        }),
        refreshToken: this.trpc.procedure.input(AuthSchema.refreshTokenRequest).mutation(({ input }) => {
            return this.authService.refreshToken(input);
        }),
        logout: this.trpc.protectProcedure.input(AuthSchema.logoutRequest).mutation(({ input }) => {
            return this.authService.logout(input);
        }),
        changePassword: this.trpc.protectProcedure.input(AuthSchema.changePassword).mutation(({ input }) => {
            return this.authService.changePassword(input);
        }),
    });
}
