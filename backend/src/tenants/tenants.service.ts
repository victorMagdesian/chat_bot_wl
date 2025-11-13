import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    // Check if domain already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { domain: createTenantDto.domain },
    });

    if (existingTenant) {
      throw new ConflictException('Domain already exists');
    }

    // Create tenant with default primary color if not provided
    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        domain: createTenantDto.domain,
        logoUrl: createTenantDto.logoUrl,
        primaryColor: createTenantDto.primaryColor || '#3182CE',
      },
    });

    return tenant;
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { domain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, requestingUserId: string) {
    // Verify tenant exists
    await this.findOne(id);

    // Verify requesting user belongs to this tenant
    const user = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!user || user.tenantId !== id) {
      throw new ForbiddenException('You can only update your own tenant');
    }

    // Update tenant
    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });

    return updatedTenant;
  }

  async remove(id: string) {
    // Verify tenant exists
    await this.findOne(id);

    // Delete tenant (cascade will handle related records)
    await this.prisma.tenant.delete({
      where: { id },
    });

    return { message: 'Tenant deleted successfully' };
  }

  // Helper method to validate tenant access
  async validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return user?.tenantId === tenantId;
  }
}
