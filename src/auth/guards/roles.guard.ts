import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserEntity } from 'src/users/entities/user.entity';
import { Role } from '../roles/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Required roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Returns true if no roles are required
    if (!requiredRoles) {
      return true;
    }

    // Current User role
    const request = context.switchToHttp().getRequest();
    const currentUser: UserEntity = request.user;

    return requiredRoles.some((role) => currentUser?.roles.includes(role));
  }
}
