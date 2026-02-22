import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('No user found in request');
        }

        // Cognito stores group memberships in 'cognito:groups' claim
        const userGroups: string[] = user['cognito:groups'] || [];
        // Also check the 'role' field stored in custom attributes
        const userRole: string = user['custom:role'] || '';

        const hasRole = requiredRoles.some(
            (role) =>
                userGroups.includes(role) ||
                userRole.toLowerCase() === role.toLowerCase(),
        );

        if (!hasRole) {
            throw new ForbiddenException(
                `User does not have required role(s): ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}
