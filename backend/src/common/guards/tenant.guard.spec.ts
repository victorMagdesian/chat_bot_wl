import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockExecutionContext = (request: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access for public routes', () => {
      const mockRequest = {};
      const context = createMockExecutionContext(mockRequest);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      const mockRequest = {};
      const context = createMockExecutionContext(mockRequest);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if tenant context is missing', () => {
      const mockRequest = {
        user: {
          id: 'user-1',
          tenantId: 'tenant-1',
        },
      };
      const context = createMockExecutionContext(mockRequest);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user tenant does not match context tenant', () => {
      const mockRequest = {
        user: {
          id: 'user-1',
          tenantId: 'tenant-1',
        },
        tenantContext: {
          tenantId: 'tenant-2',
          tenantDomain: 'other-tenant',
        },
      };
      const context = createMockExecutionContext(mockRequest);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied: Invalid tenant context');
    });

    it('should allow access when user tenant matches context tenant', () => {
      const mockRequest = {
        user: {
          id: 'user-1',
          tenantId: 'tenant-1',
        },
        tenantContext: {
          tenantId: 'tenant-1',
          tenantDomain: 'test-tenant',
        },
      };
      const context = createMockExecutionContext(mockRequest);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
