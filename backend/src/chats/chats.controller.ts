import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CurrentUser, CurrentUserData } from '../common/decorators';
import { GetChatsQueryDto, CreateChatDto, SendMessageDto, CreateScheduledMessageDto, GetScheduledMessagesQueryDto } from './dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async getChats(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetChatsQueryDto,
  ) {
    return this.chatsService.getChats(user.tenantId, query);
  }

  @Get(':id')
  async getChatById(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.chatsService.getChatById(user.tenantId, id);
  }

  @Post()
  async createOrUpdateChat(@Body() createChatDto: CreateChatDto) {
    return this.chatsService.createOrUpdateChat(createChatDto);
  }

  @Post('messages')
  async createMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.chatsService.createMessage(sendMessageDto);
  }

  @Post('scheduled-messages')
  async createScheduledMessage(
    @CurrentUser() user: CurrentUserData,
    @Body() createScheduledMessageDto: CreateScheduledMessageDto,
  ) {
    return this.chatsService.createScheduledMessage(
      user.tenantId,
      createScheduledMessageDto,
    );
  }

  @Get('scheduled-messages')
  async getScheduledMessages(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetScheduledMessagesQueryDto,
  ) {
    return this.chatsService.getScheduledMessages(user.tenantId, query);
  }

  @Delete('scheduled-messages/:id')
  async cancelScheduledMessage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.chatsService.cancelScheduledMessage(user.tenantId, id);
  }
}
