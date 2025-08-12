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

// The refresh token is in the cookie, so we need a custom token extractor.
const fromCookie = (req: Request): string | null => {
  if (req.cookies && req.cookies['refreshToken']) {
    return req.cookies['refreshToken'] as string;
  }
  // If no token is found in the cookie, return null.
  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      // jwtFromRequest: ExtractJwt.fromExtractors([
      //   //TODO : verify and replace assumption : & { cookies: { refreshToken: string } }
      //   (req: Request & { cookies: { refreshToken: string } }) => {
      //     //TODO: check
      //     return req?.cookies?.refreshToken;
      //   },
      // ]),
      jwtFromRequest: fromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    } as StrategyOptionsWithoutRequest);
  }

  validate(payload: Payload) {
    console.log('jwt-strategy - validate');
    console.log(payload);

    //TODO: You might want to do additional checks here, e.g., if the user still exists in the DB
    if (!payload) {
      throw new UnauthorizedException(
        'Invalid refresh token jwt-strategy payload not found',
      );
    }
    return payload; //{ userId: payload.sub, email: payload.email };
  }
}
