import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant from multiple sources (priority order matters)
    let tenantId: string | null = null;
    let tenantDomain: string | null = null;

    // 1. Try to get tenant from subdomain (lowest priority)
    const host = request.headers['host'];
    if (host) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        tenantDomain = subdomain;
      }
    }

    // 2. Try to get tenant from authenticated user (JWT) - overrides subdomain
    if (request.user && request.user.tenantId) {
      tenantId = request.user.tenantId;
      if (request.user.tenant) {
        tenantDomain = request.user.tenant.domain;
      }
    }

    // 3. Try to get tenant from custom header (highest priority - overrides all)
    const headerTenantId = request.headers['x-tenant-id'];
    const headerTenantDomain = request.headers['x-tenant-domain'];
    
    if (headerTenantId) {
      tenantId = headerTenantId;
    }
    
    if (headerTenantDomain) {
      tenantDomain = headerTenantDomain;
    }

    // Add tenant context to request
    request.tenantContext = {
      tenantId,
      tenantDomain,
    };

    return next.handle();
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    
    // For localhost or IP addresses, no subdomain
    if (parts.length < 2 || host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
      return null;
    }

    // Return the first part as subdomain
    return parts[0];
  }
}
