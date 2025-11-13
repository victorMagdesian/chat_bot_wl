import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';
import { InstagramService } from './instagram.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { Public } from '../common/decorators';

@Controller('instagram')
export class InstagramController {
  private readonly logger = new Logger(InstagramController.name);

  constructor(
    private readonly instagramService: InstagramService,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * GET /instagram/webhook
   * Webhook verification endpoint for Instagram
   */
  @Public()
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    this.logger.log('Webhook verification request received');
    return this.instagramService.verifyWebhook(mode, token, challenge);
  }

  /**
   * POST /instagram/webhook
   * Webhook endpoint to receive Instagram messages
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
  ): Promise<{ status: string }> {
    try {
      // Get raw body for signature validation
      const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(payload);

      // Validate webhook signature (skip in development if no signature provided)
      if (signature) {
        const isValid = this.instagramService.validateWebhookSignature(
          signature,
          rawBody,
        );

        if (!isValid) {
          throw new HttpException(
            'Invalid webhook signature',
            HttpStatus.FORBIDDEN,
          );
        }

        this.logger.log('Webhook signature validated successfully');
      } else {
        this.logger.warn('Webhook received without signature (development mode)');
      }

      // Parse and process webhook payload
      if (payload.object === 'instagram') {
        for (const entry of payload.entry || []) {
          for (const messaging of entry.messaging || []) {
            // Extract message data
            const senderId = messaging.sender?.id;
            const recipientId = messaging.recipient?.id;
            const messageText = messaging.message?.text;
            const messageId = messaging.message?.mid;
            const timestamp = messaging.timestamp;

            if (senderId && recipientId && messageText) {
              this.logger.log(
                `Received message from ${senderId} to ${recipientId}: ${messageText}`,
              );

              // Queue message for async processing
              await this.schedulerService.queueMessageProcessing({
                senderId,
                recipientId,
                messageText,
                messageId,
                timestamp,
              });

              this.logger.log(
                `Message queued for processing: ${messageId}`,
              );
            } else {
              this.logger.warn(
                'Received webhook with incomplete message data',
                messaging,
              );
            }
          }
        }
      } else {
        this.logger.warn(`Received webhook for unknown object: ${payload.object}`);
      }

      // Instagram requires 200 OK response within 20 seconds
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      
      // Still return 200 to Instagram to avoid retries
      // Log the error for investigation
      return { status: 'error' };
    }
  }
}
