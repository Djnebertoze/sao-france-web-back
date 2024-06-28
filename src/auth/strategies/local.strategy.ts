import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
 * Validates the user's credentials and returns the user object if successful.
 * Throws a NotFoundException if the user is not found or the password is incorrect.
 *
 * @param email - The email of the user.
 * @param password - The password of the user.
 * @returns A Promise that resolves to the user object if the credentials are valid.
 * @throws NotFoundException - If the user is not found or the password is incorrect.
 */
async validate(email: string, password: string): Promise<any> {
    try {
      return this.authService.validateUser(email, password);
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
