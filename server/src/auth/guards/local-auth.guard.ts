import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super();
    console.log('local auth guard');
  }
  canActivate = async (context: ExecutionContext) => {
    console.log('local auth guard - canActivate');
    let canActivate: Promise<boolean> | boolean = false;
    try {
      canActivate = (await super.canActivate(context)) as
        | Promise<boolean>
        | boolean;
    } catch (error) {
      console.log(error);
    }
    //console.log(context.switchToHttp().getRequest());
    return canActivate;
  };
}
