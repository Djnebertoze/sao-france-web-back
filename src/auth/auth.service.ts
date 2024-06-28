import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/schema/users.schema';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
 * Check login credentials of a user
 *
 * @param email - The email of the user trying to log in
 * @param password - The password of the user trying to log in
 *
 * @returns A Promise that resolves to the user object if the credentials are valid,
 *          otherwise it resolves to null.
 *
 * @throws Will throw an error if there is a problem with the database connection or
 *          if the bcrypt compare function fails.
 *
 * @remarks This function is used to validate the user's credentials before generating
 *          a JWT token. It uses the bcrypt library to compare the hashed password stored
 *          in the database with the password provided by the user.
 */
async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneAuth(email);
    const isMatch = await bcrypt.compare(password, user.password);
    if (user && isMatch) {
      const {...result } = user;
      return result;
    }
    return null;
}

/**
 * This function is responsible for generating or retrieving a JWT token for a user.
 * It first checks if the user exists and if the provided password is correct.
 * If the user exists and the password is valid, it checks if a JWT token already exists for the user.
 * If a token exists, it checks if it has expired. If the token has expired, it deletes the existing token and creates a new one.
 * If no token exists, it creates a new one.
 *
 * @param user - The user object containing the username and password.
 *
 * @returns A Promise that resolves to the user token object if successful.
 *          If the user does not exist, it resolves to a status 404 object with a message.
 *          If the password is incorrect, it resolves to a status 401 object with a message.
 *          If an error occurs during the process, it resolves to a status 500 object with a message.
 *
 * @throws Will throw an error if there is a problem with the database connection or
 *          if the JWT service fails to sign or verify the token.
 */
async getOrGenerateJwt(user: User) {
    try {
      const currentUser: UserEntity = await this.usersService.findOneByUsername(
        user.username,
      );
      if(!currentUser){
        console.log('Cant find')
        return {
          status: 404,
          message: 'Cannot find user'
        }
      }
      if(!await this.validateUser(currentUser.email, user.password)){
        return {
          status: 401,
          message: 'Wrong password'
        }
      }
      const userToken = await this.usersService.findOneUserToken(
        currentUser._id,
      );
      const payload = { _id: currentUser._id, email: currentUser.email };

      // Creates a new Token
      if (!userToken) {
        const newAccessToken = this.jwtService.sign(payload);
        const tokenInfos = this.jwtService.verify(newAccessToken);

        return this.usersService.createUserToken({
          accessToken: newAccessToken,
          issuedAt: tokenInfos.iat,
          expiresAt: tokenInfos.exp,
          userId: currentUser._id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
        });
      }

      // Deletes the existing Token & Creates a new one
      if (userToken && userToken.expiresAt < Date.now() / 1000) {
        await this.usersService.removeUserToken(userToken);

        const newAccessToken = this.jwtService.sign(payload);
        const tokenInfos = this.jwtService.verify(newAccessToken);

        return this.usersService.createUserToken({
          accessToken: newAccessToken,
          issuedAt: tokenInfos.iat,
          expiresAt: tokenInfos.exp,
          userId: currentUser._id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
        });
      }
      return userToken;
    } catch (error) {
      console.log(error)
      return {
        status: 500,
        message: 'Internal error'
      }
    }
  }
}
