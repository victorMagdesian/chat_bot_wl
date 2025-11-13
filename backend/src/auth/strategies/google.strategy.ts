import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails } = profile;
    const email = emails[0].value;

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      // Create new user with Google OAuth
      user = await this.prisma.user.create({
        data: {
          email,
          provider: 'google',
          providerId: id,
          tenantId: null, // Will be assigned later or during onboarding
        },
        include: { tenant: true },
      });
    } else if (user.provider !== 'google') {
      // Update existing user to link Google account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'google',
          providerId: id,
        },
        include: { tenant: true },
      });
    }

    done(null, user);
  }
}
