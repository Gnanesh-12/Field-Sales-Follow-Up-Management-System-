import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { EmailController } from './email.controller';
import { AdminEmailController } from './admin-email.controller';

import { EmailService } from './email.service';
import { GmailService } from './gmail.service';
import { GmailOAuthService } from './gmail-oauth.service';
import { GmailSyncService } from './gmail-sync.service';
import { MailpitService } from './mailpit.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    ConfigModule,
  ],

  controllers: [
    EmailController,
    AdminEmailController,
  ],

  providers: [
    EmailService,
    GmailService,
    GmailOAuthService,
    GmailSyncService,
    MailpitService,
  ],

  exports: [
    EmailService,
    GmailService,
    GmailOAuthService,
    GmailSyncService,
  ],
})
export class EmailModule {}