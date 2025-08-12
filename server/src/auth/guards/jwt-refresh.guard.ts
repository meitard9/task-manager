import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  constructor() {
    super();
  }
  handleRequest(err, user, info, context, status) {
    console.log(
      'jwt refresh guard - handleRequest',
      err,
      user,
      info,
      context,
      status,
    );
    if (err || !user) {
      throw err;
    }
    return user;
  }

  // canActivate = (
  //   context: ExecutionContext,
  // ): boolean | Promise<boolean> | Observable<boolean> => {
  //   console.log('jwt refresh guard');
  //   console.log(context.switchToHttp().getRequest().headers.cookie);
  //   console.log(context.switchToHttp().getRequest().cookies);
  //   const request = context.switchToHttp().getRequest();
  //   // This is the key fix:
  //   // Extract the refresh token from the cookie and set it in the Authorization header
  //   // so the Passport strategy can find it.
  //   if (request.cookies && request.cookies['refreshToken']) {
  //     request.headers.authorization =
  //       'Bearer ' + request.cookies['refreshToken'];
  //   }

  //   // Now call the parent guard's canActivate method to continue the process
  //   return super.canActivate(context);
  //   return super.canActivate(context);
  // };
  // This is the key fix. We override the getRequest method to
  // provide the token from the cookie to the underlying strategy.
  // getRequest(context: ExecutionContext) {
  //   const request = context.switchToHttp().getRequest();
  //   // Check for the refreshToken cookie.
  //   const token = request.cookies['refreshToken'];

  //   // If the token exists, attach it to a temporary 'authorization' header.
  //   // This allows the Passport strategy to find it correctly.
  //   if (token) {
  //     request.headers.authorization = `Bearer ${token}`;
  //   }

  //   return request;
  // }
}
