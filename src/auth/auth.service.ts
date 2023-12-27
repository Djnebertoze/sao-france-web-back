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

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneAuth(email);
    const isMatch = await bcrypt.compare(password, user.password);
    if (user && isMatch) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async getOrGenerateJwt(user: User) {
    console.log('mmmh')
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
      if(!this.validateUser(currentUser.email, user.password)){
        return {
          status: 401,
          message: 'Wrong password'
        }
      }
      console.log('1')
      const userToken = await this.usersService.findOneUserToken(
        currentUser._id,
      );
      console.log('2')
      const payload = { _id: currentUser._id, email: currentUser.email };
      console.log('3')

      //if (currentUser.isVerified === true) {
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
      console.log('mmh')

      return userToken;
      /*} else {
        throw new ForbiddenException();
      }*/
    } catch (error) {
      console.log('ah')
      console.log(error)
      throw new HttpException(
        {
          statusCode: error.status,
          message: error.message,
        },
        error.status,
      );
    }
  }
}
