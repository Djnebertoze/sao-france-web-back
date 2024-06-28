import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UniqueJwtGuard implements CanActivate {
	constructor(private usersService: UsersService) {}

	/**
	 * Checks if the access token in the request header matches the one stored in the database.
	 *
	 * @param {ExecutionContext} context - The execution context of the request.
	 * @returns {Promise<boolean>} - A promise that resolves to true if the access token is unique, otherwise false.
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Current User
		const request = context.switchToHttp().getRequest();
		const currentUser: UserEntity = request.user;
		const currentAccessToken = request.headers.authorization.split(' ')[1];

		const actualAccessToken = await this.usersService.findOneUserToken(currentUser._id);

		return actualAccessToken.accessToken === currentAccessToken;
	}
}
