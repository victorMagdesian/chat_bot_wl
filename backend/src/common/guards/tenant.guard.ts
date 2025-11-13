import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if user is authenticated
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Validate tenant context exists
    const tenantContext = request.tenantContext;
    if (!tenantContext || !tenantContext.tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    // Validate user belongs to the tenant
    if (request.user.tenantId !== tenantContext.tenantId) {
      throw new ForbiddenException('Access denied: Invalid tenant context');
    }

    return true;
  }
}
