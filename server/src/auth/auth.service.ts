import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
//import { UserDocument } from '../users/schemas/user.schema';
import { UserWithoutPassword } from './dto/payload.dto';
import { UserDto } from './dto/user.dto';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid
import { jwtDto } from './dto/jwt.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    console.log('service - validateUser');
    //TODO : consider using cache, minimize db calls
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      //TODO: remove eslint-disable
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; //.toJSON();
      return result as UserWithoutPassword;
    }
    return null;
  }

  /**
   * Logs in a user, generating an access token and a refresh token.
   *
   * @param user - The user document to log in.
   * @returns An object containing the access token and the refresh token.
   *
   * This method uses the `jwtService` to generate an access token and a refresh token.
   * The access token is generated from the user's email and ID.
   * The refresh token is generated from the user's email, ID, and a unique identifier (jti).
   * The jti and expiration date of the refresh token are stored in the user's database record.
   * The method returns an object containing the access token and the refresh token.
   */
  async login(user: UserDto) {
    console.log('service - login');
    if (!user) {
      //TODO: fix exception
      return null;
    }

    //TODO check if _id is string or number , type
    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload);
    //TODO: implement refresh token rotation,not as jwt.

    // Generate a unique ID for the refresh token
    const jti = uuidv4();
    const expiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRATION',
    );
    const refreshPayload = { ...payload, jti };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn,
    });

    // Calculate the expiration date
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(
      refreshExpiresAt.getDate() + parseInt(expiresIn.replace('d', '')),
    );

    // Store the jti and expiration date in the user's database record
    await this.usersService.addRefreshToken(user._id, jti, refreshExpiresAt);
    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes the user's access token and refresh token.
   *
   * @param userId - The unique identifier of the user.
   * @param jti - The unique identifier of the refresh token to be refreshed.
   * @returns A promise that resolves to an object containing the new access token and refresh token.
   *
   * This method does the following:
   * 1. Finds the refresh token in the user's record by jti.
   * 2. Removes the old token record (refresh token rotation).
   * 3. Generates a new jti and new tokens.
   * 4. Stores the new jti and its expiration date.
   * If the user is not found or the refresh token is not valid, it throws an UnauthorizedException.
   */
  async refreshTokens(userId: string, jti: string) {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    // 1. Find the refresh token in the user's record by jti
    const existingRefreshToken = user.refreshTokens.find(
      (token: { jti: string }) => token.jti === jti,
    );

    if (!existingRefreshToken) {
      // This is a crucial security check: if the jti is not in the DB, it's revoked or compromised.
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // 2. Remove the old token record (refresh token rotation)
    await this.usersService.removeRefreshToken(user._id.toString(), jti);

    // 3. Generate a new jti and new tokens
    const newJti = uuidv4();
    const expiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRATION',
    );
    const payload = { email: user.email, sub: user._id };
    const newRefreshPayload = { ...payload, jti: newJti };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn,
    });

    const newRefreshExpiresAt = new Date();
    newRefreshExpiresAt.setDate(
      newRefreshExpiresAt.getDate() + parseInt(expiresIn.replace('d', '')),
    );

    // 4. Store the new jti and its expiration date
    await this.usersService.addRefreshToken(
      user._id.toString(), //TODO: check toString or to HEX sring
      newJti,
      newRefreshExpiresAt,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logs out a user by removing their refresh token record from the database.
   *
   * @param userId - The unique identifier of the user.
   * @param jti - The unique identifier of the refresh token to be removed.
   * @returns A promise that resolves when the refresh token is removed.
   */
  async logout(userId: string, jti: string) {
    // Simply remove the refresh token record from the database
    await this.usersService.removeRefreshToken(userId, jti);
  }

  /**
   * Decodes a given JWT token and returns its payload.
   * @param token - The JWT token to decode.
   * @returns The decoded payload as a jwtDto object.
   */
  decodeToken(token: string): jwtDto {
    const decoded = this.jwtService.decode<jwtDto>(token);
    return decoded;
  }
}
