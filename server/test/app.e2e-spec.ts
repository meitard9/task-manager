/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as cookieParser from 'cookie-parser'; // Import cookie-parser

// describe('AppController (e2e)', () => {
//   let app: INestApplication<App>;

//   beforeEach(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     await app.init();
//   });

//   it('/ (GET)', () => {
//     return request(app.getHttpServer())
//       .get('/')
//       .expect(200)
//       .expect('Hello World!');
//   });
// });
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const testUser = { email: 'e2e-test@example.com', password: 'Pass@12345678' };
  let accessToken: string;
  let refreshTokenCookie: string;

  beforeAll(async () => {
    //process.env.NODE_ENV = 'test';
    // Compile the full application module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Use the same validation pipe as the application
    app.useGlobalPipes(new ValidationPipe());
    // Use the same cookieParser() as the application
    app.use(cookieParser());
    await app.init();
  });

  // --- E2E Test Flow ---
  it('/auth/register (POST) - should register a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('_id');
        expect(res.body).toHaveProperty('email', testUser.email);
        console.log(res.body);
        //expect(res.body).not.toHaveProperty('password');
      });
  });

  it('/auth/login (POST) - should log in the registered user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.headers['set-cookie']).toBeDefined();

    // Store tokens for subsequent tests
    accessToken = response.body.accessToken;
    refreshTokenCookie = response.headers['set-cookie'][0].split(';')[0];
  });

  it('/auth/profile (POST) - should access a protected route with a valid access token', () => {
    return request(app.getHttpServer())
      .post('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('email', testUser.email);
      });
  });

  it('/auth/refresh (POST) - should refresh the access token with the refresh token cookie', async () => {
    // Correctly extract the token part from the cookie string
    const cookieValue = refreshTokenCookie; //.split(';')[0];
    console.log('Sending refresh token cookie:', cookieValue); // Debugging log
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieValue)
      .auth(accessToken, { type: 'bearer' })
      //.withCredentials(true)
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('/auth/logout (POST) - should log out the user and clear the cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', refreshTokenCookie)
      .auth(accessToken, { type: 'bearer' })
      .send({})
      .expect(201);

    // Check for cookie clearing
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=;');
    expect(response.body).toEqual({ message: 'Logged out successfully' });
  });
  it('/auth/profile (POST) - should מםא access a protected route after logout', () => {
    return request(app.getHttpServer())
      .post('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401) //TODO : cheak this
      .expect((res) => {
        expect(res.body).toHaveProperty('email', testUser.email);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
