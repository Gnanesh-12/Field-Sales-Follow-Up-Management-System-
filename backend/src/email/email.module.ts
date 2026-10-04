// // import { Module } from '@nestjs/common';
// // import { JwtModule } from '@nestjs/jwt';
// // import { ConfigModule } from '@nestjs/config';
// // import { EmailController } from './email.controller';
// // import { EmailService } from './email.service';
// // import { GmailService } from './gmail.service';
// // import { GmailOAuthService } from './gmail-oauth.service';
// // import { MailpitService } from './mailpit.service';

// // /**
// //  * Email Module — Phase 1 Email Integration
// //  * 
// //  * Encapsulates all email-related functionality:
// //  * - Gmail OAuth connection management
// //  * - Email sending (Gmail API or Mailpit)
// //  * - Email history/logging
// //  * 
// //  * Gmail-specific logic is isolated in GmailService and GmailOAuthService.
// //  * Other modules can import EmailModule and inject EmailService to send emails.
// //  */
// // @Module({
// //   imports: [
// //     JwtModule.register({ secret: process.env.JWT_SECRET }),
// //     ConfigModule,
// //   ],
// //   controllers: [EmailController],
// //   providers: [
// //     EmailService,
// //     GmailService,
// //     GmailOAuthService,
// //     MailpitService,
// //   ],
// //   exports: [EmailService], // Allow other modules to send emails
// // })
// // export class EmailModule { }


// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule } from '@nestjs/config';

// import { EmailController } from './email.controller';
// import { EmailService } from './email.service';
// import { GmailService } from './gmail.service';
// import { GmailOAuthService } from './gmail-oauth.service';
// import { GmailSyncService } from './gmail-sync.service';
// import { MailpitService } from './mailpit.service';

// @Module({
//   imports: [
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//     }),
//     ConfigModule,
//   ],

//   controllers: [
//     EmailController,
//   ],

//   providers: [
//     EmailService,
//     GmailService,
//     GmailOAuthService,
//     GmailSyncService,
//     MailpitService,
//   ],

//   exports: [
//     EmailService,
//     GmailService,
//     GmailOAuthService,
//     GmailSyncService,
//   ],
// })
// export class EmailModule {}

// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule } from '@nestjs/config';

// import { EmailController } from './email.controller';
// import { AdminEmailController } from './admin-email.controller';

// import { EmailService } from './email.service';
// import { GmailService } from './gmail.service';
// import { GmailOAuthService } from './gmail-oauth.service';
// import { GmailSyncService } from './gmail-sync.service';
// import { MailpitService } from './mailpit.service';

// @Module({
//   imports: [
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//     }),
//     ConfigModule,
//   ],

//   controllers: [
//     EmailController,
//     AdminEmailController,
//   ],

//   providers: [
//     EmailService,
//     GmailService,
//     GmailOAuthService,
//     GmailSyncService,
//     MailpitService,
//   ],

//   exports: [
//     EmailService,
//     GmailService,
//     GmailOAuthService,
//     GmailSyncService,
//   ],
// })
// export class EmailModule {}

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