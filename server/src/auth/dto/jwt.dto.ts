export type jwtDto = {
  email: string;
  sub: string;
  jti: string;
  iat: number;
  exp: number;
};

/**
 ** 'user' is Gerenteed by JwtStrategy
  ** 'cookies' is Gerenteed by CookieParser middleware globally
  @Param user: { sub: string };
  @Param cookies: { refreshToken: string };
 */
export type JwtRequestDto = {
  //gerenteed by JwtStrategy
  user: { sub: string };
  //Gerenteed by CookieParser middleware globally
  cookies: { refreshToken: string };
};
