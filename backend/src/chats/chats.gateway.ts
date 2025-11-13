import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  email?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chats',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = this.extractTokenFromHandshake(client);
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to socket
      client.userId = payload.sub;
      client.tenantId = payload.tenantId;
      client.email = payload.email;

      // Join tenant-specific room
      client.join(`tenant:${client.tenantId}`);

      // Store connected client
      this.connectedClients.set(client.id, client);

      console.log(`Client connected: ${client.id} (User: ${client.email}, Tenant: ${client.tenantId})`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.tenantId) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Join chat-specific room
    client.join(`chat:${data.chatId}`);
    console.log(`Client ${client.id} joined chat ${data.chatId}`);

    return { event: 'joinedChat', data: { chatId: data.chatId } };
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
    console.log(`Client ${client.id} left chat ${data.chatId}`);

    return { event: 'leftChat', data: { chatId: data.chatId } };
  }

  // Method to emit new message to clients
  emitNewMessage(tenantId: string, chatId: string, message: any) {
    // Emit to tenant room (all users of this tenant)
    this.server.to(`tenant:${tenantId}`).emit('newMessage', {
      chatId,
      message,
    });

    // Also emit to specific chat room if anyone is watching
    this.server.to(`chat:${chatId}`).emit('chatMessage', {
      message,
    });
  }

  // Method to emit chat update (e.g., new chat created)
  emitChatUpdate(tenantId: string, chat: any) {
    this.server.to(`tenant:${tenantId}`).emit('chatUpdate', {
      chat,
    });
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Try to get token from auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from query params
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (token && typeof token === 'string') {
      return token;
    }

    return null;
  }
}
