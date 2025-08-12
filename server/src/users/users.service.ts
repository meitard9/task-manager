import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Creates a new user with the given email and password.
   *
   * @param email - The email address of the user.
   * @param password - The password of the user.
   * @returns A promise that resolves to the newly created User.
   */
  async create(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({ email, password: hashedPassword });
    return newUser.save();
  }

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address to search for.
   * @returns A promise that resolves to the UserDocument if a user with the given email is found, or null otherwise.
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Adds a new refresh token to the user with the given userId.
   *
   * @param userId - The ID of the user to add the refresh token to.
   * @param jti - The JTI (JSON Token Identifier) of the refresh token.
   * @param expiresAt - The date and time at which the refresh token will expire.
   * @returns A promise that resolves to the updated UserDocument if the refresh token was added, or null if the user was not found.
   */
  async addRefreshToken(
    userId: string,
    jti: string,
    expiresAt: Date,
  ): Promise<UserDocument | null> {
    //TODO can be null
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $push: { refreshTokens: { jti, expiresAt } } },
        { new: true },
      )
      .exec();
  }

  /**
   * Removes a refresh token from a user's record based on the token identifier (jti).
   *
   * @param userId - The unique identifier of the user.
   * @param jti - The unique identifier of the refresh token to be removed.
   * @returns A promise that resolves to the updated UserDocument or null if the user is not found.
   */
  async removeRefreshToken(
    userId: string,
    jti: string,
  ): Promise<UserDocument | null> {
    //TODO can be null
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { refreshTokens: { jti } } },
        { new: true },
      )
      .exec();
  }

  //TODO: can be deleted
  // async findUserByRefreshTokenHash(
  //   hashedToken: string,
  // ): Promise<UserDocument | null> {
  //   const allUsers = await this.userModel.find().exec();
  //   console.log('findUserByRefreshTokenHash');
  //   console.log(allUsers);
  //   console.log(hashedToken);
  //   return this.userModel.findOne({ refreshTokens: hashedToken }).exec();
  // }

  async findUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }
  /**
   * Retrieves all users from the database.
   *
   * @returns A promise that resolves to an array of UserDocuments.
   */
  async getAllUsers(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}
