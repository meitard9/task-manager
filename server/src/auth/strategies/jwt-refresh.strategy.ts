import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Payload } from '../dto/payload.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        //TODO : verify and replace assumption : & { cookies: { refreshToken: string } }
        (req: Request & { cookies: { refreshToken: string } }) => {
          //TODO: check
          return req?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    } as StrategyOptionsWithoutRequest);
  }

  validate(payload: Payload) {
    //TODO: You might want to do additional checks here, e.g., if the user still exists in the DB
    if (!payload) {
      throw new UnauthorizedException(
        'Invalid refresh token jwt-strategy payload not found',
      );
    }
    return payload; //{ userId: payload.sub, email: payload.email };
  }
}
