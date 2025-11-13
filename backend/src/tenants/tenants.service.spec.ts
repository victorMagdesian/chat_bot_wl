import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantsService', () => {
  let service: TenantsService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tenant successfully', async () => {
      const createDto = {
        name: 'Test Tenant',
        domain: 'test-tenant',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#FF0000',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({
        id: 'tenant-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(result.domain).toBe(createDto.domain);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { domain: createDto.domain },
      });
    });

    it('should throw ConflictException if domain already exists', async () => {
      const createDto = {
        name: 'Test Tenant',
        domain: 'existing-domain',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: 'existing-tenant',
        domain: 'existing-domain',
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByDomain', () => {
    it('should find tenant by domain', async () => {
      const tenant = {
        id: 'tenant-1',
        name: 'Test Tenant',
        domain: 'test-tenant',
        logoUrl: null,
        primaryColor: '#3182CE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(tenant);

      const result = await service.findByDomain('test-tenant');

      expect(result).toEqual(tenant);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { domain: 'test-tenant' },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findByDomain('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update tenant when user belongs to tenant', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';
      const updateDto = {
        name: 'Updated Name',
        primaryColor: '#00FF00',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        name: 'Old Name',
        domain: 'test-tenant',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId: tenantId,
      });

      mockPrismaService.tenant.update.mockResolvedValue({
        id: tenantId,
        ...updateDto,
        domain: 'test-tenant',
      });

      const result = await service.update(tenantId, updateDto, userId);

      expect(result.name).toBe(updateDto.name);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: updateDto,
      });
    });

    it('should throw ForbiddenException when user does not belong to tenant', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';
      const updateDto = { name: 'Updated Name' };

      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        name: 'Test Tenant',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId: 'different-tenant',
      });

      await expect(service.update(tenantId, updateDto, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateTenantAccess', () => {
    it('should return true when user belongs to tenant', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId: tenantId,
      });

      const result = await service.validateTenantAccess(tenantId, userId);

      expect(result).toBe(true);
    });

    it('should return false when user does not belong to tenant', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        tenantId: 'different-tenant',
      });

      const result = await service.validateTenantAccess(tenantId, userId);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateTenantAccess('tenant-1', 'user-1');

      expect(result).toBe(false);
    });
  });
});
