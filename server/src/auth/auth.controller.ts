//server\src\auth\auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { userDto } from './dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService, // To create users for registration
  ) {
    console.log('controller');
  }
  private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  private readonly REFRESH_TOKEN_NAME = 'refreshToken';

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.usersService.create(registerDto.email, registerDto.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: userDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    //TODO fix error messages
    //const user = req.user;
    console.log('controller - login'); //TODO the guard do the user input
    //console.log(user);
    // if (!user) {
    //   throw new UnauthorizedException('user null/undefined');
    // }
    // if (user.email === undefined || user._id === undefined) {
    //   throw new UnauthorizedException('user dont have email or id');
    // }
    const loginUser = await this.authService.login(user);
    // if (!loginUser) {
    //   throw new UnauthorizedException('loginUser is null');
    // }
    const { accessToken, refreshToken } = loginUser as {
      accessToken: string;
      refreshToken: string;
    };
    //SetCookie
    this.setCookie(res, this.REFRESH_TOKEN_NAME, refreshToken);
    return { accessToken };
  }
  /**
   * Sets a cookie with the given name and value on the response.
   * @param res - The response object.
   * @param cookieName - The name of the cookie.
   * @param cookieValue - The value of the cookie.
   * @example
   * setCookie(res, 'refreshToken', refreshToken);
   */
  private setCookie(res: Response, cookieName: string, cookieValue: string) {
    res.cookie(cookieName, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict', // Adjust as needed: 'lax' for some cross-site navigation
      maxAge: this.MAX_AGE, // 7 days (should match JWT_REFRESH_EXPIRATION)
    });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshTokens(
    //TODO : verify and replace assumption : & { user: { sub: string }; cookies: { refreshToken: string }
    @Req()
    req: Request & { user: { sub: string }; cookies: { refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('controller - refresh');
    // console.log(req.user);
    // console.log(req.cookies);
    const userId = req.user['sub']; // 'sub' is the user ID from the refresh token payload
    const { jti } = this.authService.decodeToken(
      req.cookies[this.REFRESH_TOKEN_NAME],
    );

    if (!jti) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      userId,
      jti,
    );
    //SetCookie
    this.setCookie(res, this.REFRESH_TOKEN_NAME, refreshToken);

    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    //TODO : verify and replace assumption : & { user: { sub: string }; cookies: { refreshToken: string }
    @Req()
    req: Request & { user: { sub: string }; cookies: { refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user['sub'];
    const { jti } = this.authService.decodeToken(
      req.cookies[this.REFRESH_TOKEN_NAME],
    );

    if (jti) {
      await this.authService.logout(userId, jti);
    }

    res.clearCookie(this.REFRESH_TOKEN_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  //TODO : verify and replace assumption : & { user: string }
  getProfile(@Req() req: Request & { user: string }) {
    return req.user;
  }
}
