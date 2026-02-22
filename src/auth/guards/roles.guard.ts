import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../common/types';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser | undefined = request.user;

        if (!user) {
            throw new ForbiddenException('No user found in request');
        }

        // Check Cognito group memberships (case-insensitive)
        const userGroupsLower = user.groups.map((g) => g.toLowerCase());
        const hasRole = requiredRoles.some((role) =>
            userGroupsLower.includes(role.toLowerCase()),
        );

        if (!hasRole) {
            throw new ForbiddenException(
                `User does not have required role(s): ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}
