import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly graphApiUrl = 'https://graph.instagram.com/v18.0';
  private readonly rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  constructor(
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send a message to an Instagram user via Graph API
   * @param recipientId Instagram user ID
   * @param message Message text to send
   * @param accessToken Bot's Instagram access token
   * @returns Message ID from Instagram
   */
  async sendMessage(
    recipientId: string,
    message: string,
    accessToken: string,
  ): Promise<string> {
    try {
      // Rate limiting awareness - wait if needed
      await this.enforceRateLimit();

      const url = `${this.graphApiUrl}/me/messages`;
      
      const payload = {
        recipient: {
          id: recipientId,
        },
        message: {
          text: message,
        },
      };

      this.logger.log(
        `Sending message to Instagram user ${recipientId}: ${message.substring(0, 50)}...`,
      );

      const response = await axios.post(url, payload, {
        params: {
          access_token: accessToken,
        },
        timeout: 10000, // 10 second timeout
      });

      const messageId = response.data.message_id;
      this.logger.log(`Message sent successfully. Message ID: ${messageId}`);

      return messageId;
    } catch (error) {
      return this.handleInstagramError(error, 'sendMessage');
    }
  }

  /**
   * Verify webhook subscription with Instagram
   * @param mode Verification mode
   * @param token Verification token
   * @param challenge Challenge string to echo back
   * @returns Challenge string if verification succeeds
   */
  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.configService.get<string>(
      'INSTAGRAM_WEBHOOK_VERIFY_TOKEN',
    );

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.error('Webhook verification failed: Invalid token or mode');
    throw new HttpException(
      'Webhook verification failed',
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * Validate webhook signature to ensure request is from Instagram
   * @param signature Signature from X-Hub-Signature-256 header
   * @param payload Raw request body
   * @returns True if signature is valid
   */
  validateWebhookSignature(signature: string, payload: string): boolean {
    if (!signature) {
      this.logger.error('Missing webhook signature');
      return false;
    }

    const crypto = require('crypto');
    const appSecret = this.configService.get<string>('INSTAGRAM_APP_SECRET');

    // Instagram sends signature as "sha256=<hash>"
    const expectedSignature = signature.split('=')[1];
    
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    const isValid = calculatedSignature === expectedSignature;

    if (!isValid) {
      this.logger.error('Invalid webhook signature');
    }

    return isValid;
  }

  /**
   * Enforce rate limiting to avoid hitting Instagram API limits
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      this.logger.debug(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Handle Instagram API errors with proper logging and error transformation
   */
  private handleInstagramError(error: any, operation: string): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      this.logger.error(
        `Instagram API error during ${operation}: ${status} - ${JSON.stringify(errorData)}`,
      );

      // Map Instagram API errors to appropriate HTTP status codes
      if (status === 400) {
        throw new HttpException(
          errorData?.error?.message || 'Invalid request to Instagram API',
          HttpStatus.BAD_REQUEST,
        );
      } else if (status === 401 || status === 403) {
        throw new HttpException(
          'Instagram authentication failed. Please check bot credentials.',
          HttpStatus.UNAUTHORIZED,
        );
      } else if (status === 429) {
        throw new HttpException(
          'Instagram API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else if (status >= 500) {
        throw new HttpException(
          'Instagram API is currently unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    this.logger.error(`Unexpected error during ${operation}:`, error);
    throw new HttpException(
      'Failed to communicate with Instagram API',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
