import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  SetMetadata,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

import { EmailService } from './email.service';
import { GmailOAuthService } from './gmail-oauth.service';
import { GmailSyncService } from './gmail-sync.service';

import {
  SendEmailDto,
  SendVisitReportDto,
} from './dto/send-email.dto';

import * as express from 'express';

import { ConfigService } from '@nestjs/config';

const Roles = (...roles: string[]) =>
  SetMetadata('roles', roles);

@Controller('email')
export class EmailController {
  private readonly logger =
    new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly gmailOAuthService: GmailOAuthService,
    private readonly gmailSyncService: GmailSyncService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================
  // GMAIL OAUTH
  // ============================================================

  @Get('gmail/auth-url')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async getGmailAuthUrl(
    @Req() req: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    try {
      const authUrl =
        this.gmailOAuthService.getAuthUrl(
          employeeId,
        );

      return {
        authUrl,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message,
      );
    }
  }

  @Get('gmail/callback')
  async handleGmailCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: express.Response,
  ) {
    const appScheme =
      this.configService.get<string>(
        'APP_DEEP_LINK_SCHEME',
      ) || 'kshetra';

    if (error) {
      return res.redirect(
        `${appScheme}://gmail-callback?error=${encodeURIComponent(
          error,
        )}`,
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${appScheme}://gmail-callback?error=missing_params`,
      );
    }

    try {
      const result =
        await this.gmailOAuthService.handleCallback(
          code,
          state,
        );

      return res.redirect(
        `${appScheme}://gmail-callback?success=true&email=${encodeURIComponent(
          result.gmailAddress,
        )}`,
      );
    } catch (err) {
      this.logger.error(
        `OAuth callback error: ${err.message}`,
      );

      return res.redirect(
        `${appScheme}://gmail-callback?error=${encodeURIComponent(
          'Connection failed. Please try again.',
        )}`,
      );
    }
  }

  @Get('gmail/callback/web')
  async handleGmailCallbackWeb(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: express.Response,
  ) {
    if (error) {
      return res.send(
        this.buildCallbackHtml(
          false,
          error,
        ),
      );
    }

    if (!code || !state) {
      return res.send(
        this.buildCallbackHtml(
          false,
          'Missing parameters',
        ),
      );
    }

    try {
      const result =
        await this.gmailOAuthService.handleCallback(
          code,
          state,
        );

      return res.send(
        this.buildCallbackHtml(
          true,
          undefined,
          result.gmailAddress,
        ),
      );
    } catch (err) {
      return res.send(
        this.buildCallbackHtml(
          false,
          err.message,
        ),
      );
    }
  }

  @Get('gmail/status')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async getGmailStatus(
    @Req() req: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.gmailOAuthService.getConnectionStatus(
      employeeId,
    );
  }

  @Delete('gmail/disconnect')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async disconnectGmail(
    @Req() req: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    await this.gmailOAuthService.disconnect(
      employeeId,
    );

    return {
      message:
        'Gmail disconnected successfully.',
    };
  }

  // ============================================================
  // PHASE 1 — SEND
  // ============================================================

  @Post('send')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async sendEmail(
    @Req() req: any,
    @Body() dto: SendEmailDto,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    try {
      return await this.emailService.sendEmail(
        employeeId,
        dto,
      );
    } catch (error) {
      if (
        error instanceof
        BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Send email failed: ${error.message}`,
      );

      throw new InternalServerErrorException(
        error.message ||
          'Failed to send email.',
      );
    }
  }

  @Post('send-visit-report')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async sendVisitReport(
    @Req() req: any,
    @Body() dto: SendVisitReportDto,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.emailService.sendVisitReport(
      employeeId,
      dto,
    );
  }

  // ============================================================
  // PHASE 1 — HISTORY
  // ============================================================

  @Get('history')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async getEmailHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.emailService.getEmailHistory(
      employeeId,
      page
        ? parseInt(page, 10)
        : 1,
      limit
        ? parseInt(limit, 10)
        : 20,
    );
  }

  @Get('history/:id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async getEmailDetail(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.emailService.getEmailDetail(
      employeeId,
      id,
    );
  }

  // ============================================================
  // PHASE 2 — INBOX
  // ============================================================

  /**
   * GET /email/inbox
   */
  @Get('inbox')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  // async getInbox(
  //   @Req() req: any,
  // ) {
  //   const employeeId =
  //     req.user.sub ||
  //     req.user.employeeId;

  //   return this.emailService.getEmployeeEmailThreads(
  //     employeeId,
  //   );
  // }

  async getInbox(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerSiteId') customerSiteId?: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.emailService.getEmployeeEmailThreads(
      employeeId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
      customerSiteId,
    );
  }

  /**
   * GET /email/threads/:threadId
   */
  @Get('threads/:threadId')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async getEmailThread(
    @Req() req: any,
    @Param('threadId')
    threadId: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.emailService.getEmailThread(
      employeeId,
      threadId,
    );
  }

  /**
   * POST /email/sync
   */
  @Post('sync')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async syncInbox(
    @Req() req: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.gmailSyncService.syncEmployeeInbox(
      employeeId,
    );
  }

  /**
   * POST /email/threads/:threadId/reply
   */
  @Post(
    'threads/:threadId/reply',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async replyToThread(
    @Req() req: any,
    @Param('threadId')
    threadId: string,
    @Body() body: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    if (!body?.body?.trim()) {
      throw new BadRequestException(
        'Reply body is required.',
      );
    }

    return this.emailService.replyToThread(
      employeeId,
      threadId,
      body.body.trim(),
    );
  }

  /**
   * POST /email/messages/:messageId/forward
   */
  @Post(
    'messages/:messageId/forward',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async forwardMessage(
    @Req() req: any,
    @Param('messageId')
    messageId: string,
    @Body() body: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    if (!body?.to?.trim()) {
      throw new BadRequestException(
        'Recipient email is required.',
      );
    }

    return this.emailService.forwardMessage(
      employeeId,
      messageId,
      body.to.trim(),
      body.body?.trim() || '',
    );
  }

  /**
   * POST /email/threads/:threadId/read
   */
  @Post(
    'threads/:threadId/read',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async markThreadRead(
    @Req() req: any,
    @Param('threadId')
    threadId: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.emailService.markThreadRead(
      employeeId,
      threadId,
    );
  }

  // ============================================================
  // CALLBACK HTML
  // ============================================================

  private buildCallbackHtml(
    success: boolean,
    error?: string,
    email?: string,
  ): string {
    const title = success
      ? 'Gmail Connected!'
      : 'Connection Failed';

    const message = success
      ? `Your Gmail account (${email}) has been connected to Kshetra. You can close this window.`
      : `Failed to connect Gmail: ${error}. Please close this window and try again.`;

    const color = success
      ? '#22c55e'
      : '#ef4444';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} — Kshetra</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >
        <style>
          body {
            font-family:
              -apple-system,
              BlinkMacSystemFont,
              'Segoe UI',
              Roboto,
              sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
          }

          .card {
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 420px;
            box-shadow:
              0 4px 24px
              rgba(0,0,0,0.08);
            text-align: center;
          }

          .icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          h1 {
            color: ${color};
            margin: 0 0 12px;
            font-size: 24px;
          }

          p {
            color: #64748b;
            line-height: 1.6;
            margin: 0;
          }
        </style>
      </head>

      <body>
        <div class="card">
          <div class="icon">
            ${success ? '✓' : '×'}
          </div>

          <h1>${title}</h1>

          <p>
            ${message}
          </p>
        </div>

        <script>
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `;
  }
}