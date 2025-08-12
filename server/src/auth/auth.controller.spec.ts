/* eslint-disable @typescript-eslint/unbound-method */
// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';

// describe('AuthController', () => {
//   let controller: AuthController;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//     }).compile();

//     controller = module.get<AuthController>(AuthController);
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });
// });

// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { UserDto } from './dto/user.dto';
import { JwtRequestDto } from './dto/jwt.dto';

// Create a mock user object for consistency
const mockUser: UserDto = { _id: 'mock-user-id', email: 'test@example.com' };
const strongPassword = 'Pass@12345678';
const weakPassword = 'password';

// Mock the services that the controller depends on
const mockAuthService = {
  login: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  refreshTokens: jest.fn().mockResolvedValue({
    accessToken: 'new-mock-access-token',
    refreshToken: 'new-mock-refresh-token',
  }),
  logout: jest.fn().mockResolvedValue(true),
  decodeToken: jest.fn().mockReturnValue({ jti: 'mock-jti' }),
};

const mockUsersService = {
  create: jest.fn().mockResolvedValue(mockUser),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    // Setup a testing module with mock providers
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        LocalAuthGuard,
        JwtAuthGuard,
        JwtRefreshGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Register Endpoint Tests ---
  describe('register', () => {
    it('should create a new user and return it', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const createdUser = await controller.register(registerDto);
      // Verify that the usersService.create method was called once with the correct arguments
      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
      );
      expect(createdUser).toEqual(mockUser);
    });
  });

  // --- Login Endpoint Tests ---
  describe('login', () => {
    it('should log in a user and set a refresh token cookie', async () => {
      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.login(mockUser, mockRes);
      // Verify that the authService.login method was called with the user object
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      // Verify that the response cookie was set with the refresh token
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.any(Object),
      );
      // Verify the controller returns the access token
      expect(result).toEqual({ accessToken: 'mock-access-token' });
    });

    it('should throw UnauthorizedException if login fails', async () => {
      // Mock the login method to return null for this specific test
      mockAuthService.login.mockResolvedValueOnce(null);
      await expect(controller.login(mockUser, {} as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // --- Refresh Tokens Endpoint Tests ---
  describe('refreshTokens', () => {
    it('should refresh tokens and set a new cookie', async () => {
      const mockReq: JwtRequestDto = {
        user: { sub: mockUser._id },
        cookies: { refreshToken: 'old-mock-refresh-token' },
      };

      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.refreshTokens(mockReq, mockRes);

      // Verify that the refreshTokens service method was called
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        mockUser._id,
        'mock-jti',
      );
      // Verify that the new refresh token was set as a cookie
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-mock-refresh-token',
        expect.any(Object),
      );
      // Verify the controller returns the new access token
      expect(result).toEqual({ accessToken: 'new-mock-access-token' });
    });

    it('should throw UnauthorizedException if jti is not found', async () => {
      // Mock the decodeToken method to return a falsy value for jti
      mockAuthService.decodeToken.mockReturnValueOnce({});
      const mockReq = {
        cookies: { refreshToken: 'invalid-token' },
        user: { sub: mockUser._id },
      } as unknown as Request & {
        //TODO : Make this a type
        user: { sub: string };
        cookies: { refreshToken: string };
      };
      await expect(
        controller.refreshTokens(mockReq, {} as Response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // --- Logout Endpoint Tests ---
  describe('logout', () => {
    it('should clear the refresh token cookie and log out the user', async () => {
      const mockReq: JwtRequestDto = {
        cookies: { refreshToken: 'some-refresh-token' },
        user: {
          sub: mockUser._id,
        },
      };

      const mockRes = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.logout(mockReq, mockRes);
      // Verify that the logout service method was called with the correct arguments
      expect(authService.logout).toHaveBeenCalledWith(mockUser._id, 'mock-jti');
      // Verify that the refresh token cookie was cleared
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  // --- Profile Endpoint Tests ---
  describe('getProfile', () => {
    it('should return the user object from the CurrentUser decorator', () => {
      const result = controller.getProfile({ user: mockUser });
      // The decorator should pass the user object, so we just check if it's returned
      expect(result).toEqual(mockUser);
    });
  });
});
