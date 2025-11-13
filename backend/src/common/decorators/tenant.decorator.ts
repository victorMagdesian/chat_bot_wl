import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
  tenantId: string | null;
  tenantDomain: string | null;
}

export const Tenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // First try to get full tenant object from user (includes all tenant data)
    if (request.user && request.user.tenant) {
      return data ? request.user.tenant[data] : request.user.tenant;
    }

    // Fallback to tenant context (only has tenantId and tenantDomain)
    const tenantContext: TenantContext = request.tenantContext;
    if (!tenantContext) {
      return null;
    }

    if (data === 'id') {
      return tenantContext.tenantId;
    } else if (data === 'domain') {
      return tenantContext.tenantDomain;
    }

    return tenantContext;
  },
);
