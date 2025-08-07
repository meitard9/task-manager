import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserWithoutPassword } from '../dto/payload.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      usernameField: 'email', // Use email as the username field
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword> {
    console.log('PassportStrategy - validate');
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('PassportStrategy');
    }
    return user;
  }
}
