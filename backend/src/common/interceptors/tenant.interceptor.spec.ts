import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { TenantInterceptor } from './tenant.interceptor';
import { of } from 'rxjs';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantInterceptor],
    }).compile();

    interceptor = module.get<TenantInterceptor>(TenantInterceptor);
  });

  const createMockExecutionContext = (request: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (): CallHandler => {
    return {
      handle: () => of({}),
    } as CallHandler;
  };

  describe('intercept', () => {
    it('should extract tenant from authenticated user', () => {
      const mockRequest: any = {
        user: {
          tenantId: 'tenant-123',
          tenant: {
            id: 'tenant-123',
            domain: 'test-tenant',
          },
        },
        headers: {},
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next);

      expect(mockRequest.tenantContext).toBeDefined();
      expect(mockRequest.tenantContext.tenantId).toBe('tenant-123');
      expect(mockRequest.tenantContext.tenantDomain).toBe('test-tenant');
    });

    it('should extract tenant from custom headers', () => {
      const mockRequest: any = {
        headers: {
          'x-tenant-id': 'tenant-456',
          'x-tenant-domain': 'header-tenant',
        },
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next);

      expect(mockRequest.tenantContext).toBeDefined();
      expect(mockRequest.tenantContext.tenantId).toBe('tenant-456');
      expect(mockRequest.tenantContext.tenantDomain).toBe('header-tenant');
    });

    it('should extract tenant from subdomain', () => {
      const mockRequest: any = {
        headers: {
          host: 'acme.example.com',
        },
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next);

      expect(mockRequest.tenantContext).toBeDefined();
      expect(mockRequest.tenantContext.tenantDomain).toBe('acme');
    });

    it('should not extract subdomain from localhost', () => {
      const mockRequest: any = {
        headers: {
          host: 'localhost:3000',
        },
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next);

      expect(mockRequest.tenantContext).toBeDefined();
      expect(mockRequest.tenantContext.tenantDomain).toBeNull();
    });

    it('should prioritize header over subdomain', () => {
      const mockRequest: any = {
        headers: {
          host: 'subdomain.example.com',
          'x-tenant-domain': 'header-tenant',
        },
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next);

      expect(mockRequest.tenantContext.tenantDomain).toBe('header-tenant');
    });

    it('should handle request with no tenant information', () => {
      const mockRequest: any = {
        headers: {},
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next);

      expect(mockRequest.tenantContext).toBeDefined();
      expect(mockRequest.tenantContext.tenantId).toBeNull();
      expect(mockRequest.tenantContext.tenantDomain).toBeNull();
    });
  });
});
