import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { JwtAuthGuard } from '../common/guards';
import { Tenant } from '../common/decorators';

@Controller('automations')
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Post()
  create(
    @Body() createAutomationDto: CreateAutomationDto,
    @Tenant('id') tenantId: string,
  ) {
    return this.automationsService.create(createAutomationDto, tenantId);
  }

  @Get()
  findAll(
    @Query('botId') botId: string,
    @Tenant('id') tenantId: string,
  ) {
    return this.automationsService.findAll(botId, tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Tenant('id') tenantId: string,
  ) {
    return this.automationsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAutomationDto: UpdateAutomationDto,
    @Tenant('id') tenantId: string,
  ) {
    return this.automationsService.update(id, updateAutomationDto, tenantId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Tenant('id') tenantId: string,
  ) {
    return this.automationsService.remove(id, tenantId);
  }
}
