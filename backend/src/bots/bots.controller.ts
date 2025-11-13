import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('bots')
@UseGuards(JwtAuthGuard)
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  create(
    @Body() createBotDto: CreateBotDto,
    @CurrentUser('tenantId') userTenantId: string,
  ) {
    // Use tenantId from DTO if provided (for admin), otherwise use user's tenantId
    const tenantId = createBotDto.tenantId || userTenantId;
    return this.botsService.create(createBotDto, tenantId);
  }

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.botsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.botsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBotDto: UpdateBotDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.botsService.update(id, updateBotDto, tenantId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.botsService.remove(id, tenantId);
  }

  @Patch(':id/activate')
  activate(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.botsService.setActive(id, true, tenantId);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.botsService.setActive(id, false, tenantId);
  }
}
