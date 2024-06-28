import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserEntity } from 'src/users/entities/user.entity';
import { Role } from '../roles/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Checks if the current user has the required roles to access the route.
   *
   * @param {ExecutionContext} context - The execution context of the route.
   * @returns {boolean} - Returns `true` if the user has the required roles, otherwise `false`.
   */
  canActivate(context: ExecutionContext): boolean {
    // Required roles for the route, obtained from the `@Roles` decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required for the route, return true
    if (!requiredRoles) {
      return true;
    }

    // Get the current user from the request
    const request = context.switchToHttp().getRequest();
    const currentUser: UserEntity = request.user;

    // Check if the current user has any of the required roles
    return requiredRoles.some((role) => currentUser?.roles.includes(role));
  }
}
