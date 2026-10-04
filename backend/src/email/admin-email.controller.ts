// import {
//   Body,
//   Controller,
//   Get,
//   Param,
//   Post,
//   Req,
//   UnauthorizedException,
//   UseGuards,
// } from '@nestjs/common';

// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { EmailService } from './email.service';
// import { GmailSyncService } from './gmail-sync.service';

// @Controller('api/admin/email')
// @UseGuards(JwtAuthGuard)
// export class AdminEmailController {
//   constructor(
//     private readonly emailService: EmailService,
//     private readonly gmailSyncService: GmailSyncService,
//   ) {}

//   /**
//    * GET /api/admin/email/employees/:employeeId/threads
//    *
//    * Get email conversations belonging to a specific employee.
//    */
//   @Get('employees/:employeeId/threads')
//   async getEmployeeEmailThreads(
//     @Param('employeeId') employeeId: string,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     return this.emailService.getEmployeeEmailThreads(employeeId);
//   }

//   /**
//    * POST /api/admin/email/employees/:employeeId/sync
//    *
//    * Manually synchronize the employee's Gmail inbox.
//    */
//   @Post('employees/:employeeId/sync')
//   async syncEmployeeEmail(
//     @Param('employeeId') employeeId: string,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     return this.gmailSyncService.syncEmployeeInbox(employeeId);
//   }

//   /**
//    * GET /api/admin/email/threads/:threadId
//    *
//    * Get one complete email conversation.
//    */
//   @Get('threads/:threadId')
//   async getAdminEmailThread(
//     @Param('threadId') threadId: string,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     return this.emailService.getThreadForAdmin(threadId);
//   }

//   /**
//    * POST /api/admin/email/threads/:threadId/reply
//    *
//    * Reply to an existing customer conversation
//    * using the employee's connected Gmail account.
//    */
//   @Post('threads/:threadId/reply')
//   async replyAsEmployee(
//     @Param('threadId') threadId: string,
//     @Body() body: any,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     if (!body?.employeeId) {
//       throw new UnauthorizedException('Employee ID is required.');
//     }

//     if (!body?.body?.trim()) {
//       throw new UnauthorizedException('Reply body is required.');
//     }

//     return this.emailService.replyToThread(
//       body.employeeId,
//       threadId,
//       body.body.trim(),
//     );
//   }

//   /**
//    * POST /api/admin/email/messages/:messageId/forward
//    *
//    * Forward an existing email using the employee's Gmail account.
//    */
//   @Post('messages/:messageId/forward')
//   async forwardAsEmployee(
//     @Param('messageId') messageId: string,
//     @Body() body: any,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     if (!body?.employeeId) {
//       throw new UnauthorizedException('Employee ID is required.');
//     }

//     if (!body?.to?.trim()) {
//       throw new UnauthorizedException('Recipient email is required.');
//     }

//     return this.emailService.forwardMessage(
//       body.employeeId,
//       messageId,
//       body.to.trim(),
//       body.body?.trim() || '',
//     );
//   }

//   /**
//    * Make sure only an ADMIN JWT can access these routes.
//    */
//   private ensureAdmin(req: any): void {
//     const role = req.user?.role;

//     if (role !== 'ADMIN') {
//       throw new UnauthorizedException(
//         'Administrator access is required.',
//       );
//     }
//   }
// }

// import {
//   Body,
//   Controller,
//   Get,
//   Param,
//   Post,
//   Req,
//   UnauthorizedException,
//   UseGuards,
// } from '@nestjs/common';

// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// import { EmailService } from './email.service';
// import { GmailSyncService } from './gmail-sync.service';

// @Controller('admin/email')
// @UseGuards(JwtAuthGuard)
// export class AdminEmailController {
//   constructor(
//     private readonly emailService: EmailService,
//     private readonly gmailSyncService: GmailSyncService,
//   ) {}

//   @Get(
//     'employees/:employeeId/threads',
//   )
//   async getEmployeeEmailThreads(
//     @Param('employeeId')
//     employeeId: string,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     return this.emailService.getEmployeeEmailThreads(
//       employeeId,
//     );
//   }

//   @Post(
//     'employees/:employeeId/sync',
//   )
//   async syncEmployeeEmail(
//     @Param('employeeId')
//     employeeId: string,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     return this.gmailSyncService.syncEmployee(
//       employeeId,
//     );
//   }

//   @Get(
//     'threads/:threadId',
//   )
//   async getAdminEmailThread(
//     @Param('threadId')
//     threadId: string,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     return this.emailService.getThreadForAdmin(
//       threadId,
//     );
//   }

//   @Post(
//     'threads/:threadId/reply',
//   )
//   async replyAsEmployee(
//     @Param('threadId')
//     threadId: string,
//     @Body() body: any,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     if (!body?.employeeId) {
//       throw new UnauthorizedException(
//         'Employee ID is required.',
//       );
//     }

//     if (!body?.body?.trim()) {
//       throw new UnauthorizedException(
//         'Reply body is required.',
//       );
//     }

//     return this.emailService.replyToThread(
//       body.employeeId,
//       threadId,
//       body.body.trim(),
//     );
//   }

//   @Post(
//     'messages/:messageId/forward',
//   )
//   async forwardAsEmployee(
//     @Param('messageId')
//     messageId: string,
//     @Body() body: any,
//     @Req() req: any,
//   ) {
//     this.ensureAdmin(req);

//     if (!body?.employeeId) {
//       throw new UnauthorizedException(
//         'Employee ID is required.',
//       );
//     }

//     if (!body?.to?.trim()) {
//       throw new UnauthorizedException(
//         'Recipient email is required.',
//       );
//     }

//     return this.emailService.forwardMessage(
//       body.employeeId,
//       messageId,
//       body.to.trim(),
//       body.body?.trim() || '',
//     );
//   }

//   private ensureAdmin(
//     req: any,
//   ): void {
//     if (
//       req.user?.role !==
//       'ADMIN'
//     ) {
//       throw new UnauthorizedException(
//         'Administrator access is required.',
//       );
//     }
//   }
// }


import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import {
  EmailService,
} from './email.service';

import {
  GmailSyncService,
} from './gmail-sync.service';

import {
  GmailOAuthService,
} from './gmail-oauth.service';

import {
  AdminGmailService,
} from './admin-gmail.service';

@Controller('api/admin/email')
@UseGuards(JwtAuthGuard)
export class AdminEmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly gmailSyncService: GmailSyncService,
    private readonly gmailOAuthService: GmailOAuthService,
    private readonly adminGmailService: AdminGmailService,
  ) {}

  // ============================================================
  // ADMIN GMAIL CONNECTION
  // ============================================================

  @Get('gmail/auth-url')
  async getAdminGmailAuthUrl(
    @Req() req: any,
  ) {
    this.ensureAdmin(req);

    const adminId =
      req.user?.sub;

    return {
      authUrl:
        this.gmailOAuthService.getAdminAuthUrl(
          adminId,
        ),
    };
  }

  @Get('gmail/status')
  async getAdminGmailStatus(
    @Req() req: any,
  ) {
    this.ensureAdmin(req);

    const adminId =
      req.user?.sub;

    return this.gmailOAuthService.getAdminConnectionStatus(
      adminId,
    );
  }

  @Delete('gmail/disconnect')
  async disconnectAdminGmail(
    @Req() req: any,
  ) {
    this.ensureAdmin(req);

    const adminId =
      req.user?.sub;

    await this.gmailOAuthService.disconnectAdmin(
      adminId,
    );

    return {
      success: true,
      message:
        'Admin Gmail disconnected successfully.',
    };
  }

  // ============================================================
  // ADMIN GMAIL INBOX
  // ============================================================

  @Get('inbox')
  async getAdminInbox(
    @Req() req: any,
    @Query('employeeId')
    employeeId?: string,
  ) {
    this.ensureAdmin(req);

    const adminId =
      req.user?.sub;

    return this.adminGmailService.getInbox(
      adminId,
      employeeId,
    );
  }

  @Get('threads/:threadId')
  async getAdminThread(
    @Req() req: any,
    @Param('threadId')
    threadId: string,
  ) {
    this.ensureAdmin(req);

    const adminId =
      req.user?.sub;

    return this.adminGmailService.getThread(
      adminId,
      threadId,
    );
  }

  @Post('threads/:threadId/reply')
  async replyFromAdmin(
    @Req() req: any,
    @Param('threadId')
    threadId: string,
    @Body() body: any,
  ) {
    this.ensureAdmin(req);

    if (!body?.body?.trim()) {
      throw new UnauthorizedException(
        'Reply body is required.',
      );
    }

    const adminId =
      req.user?.sub;

    return this.adminGmailService.reply(
      adminId,
      threadId,
      body.body.trim(),
      body.to?.trim(),
      body.subject?.trim(),
    );
  }

  @Post('threads/:threadId/read')
  async markAdminThreadRead(
    @Req() req: any,
    @Param('threadId')
    threadId: string,
  ) {
    this.ensureAdmin(req);

    const adminId =
      req.user?.sub;

    return this.adminGmailService.markRead(
      adminId,
      threadId,
    );
  }

  // ============================================================
  // EXISTING EMPLOYEE EMAIL VIEW
  // ============================================================

  @Get(
    'employees/:employeeId/threads',
  )
  async getEmployeeEmailThreads(
    @Param('employeeId')
    employeeId: string,
    @Req() req: any,
  ) {
    this.ensureAdmin(req);

    return this.emailService.getEmployeeEmailThreads(
      employeeId,
    );
  }

  @Post(
    'employees/:employeeId/sync',
  )
  async syncEmployeeEmail(
    @Param('employeeId')
    employeeId: string,
    @Req() req: any,
  ) {
    this.ensureAdmin(req);

    return this.gmailSyncService.syncEmployee(
      employeeId,
    );
  }

  @Get(
    'employee-threads/:threadId',
  )
  async getEmployeeThread(
    @Param('threadId')
    threadId: string,
    @Req() req: any,
  ) {
    this.ensureAdmin(req);

    return this.emailService.getThreadForAdmin(
      threadId,
    );
  }

  @Post(
    'employee-threads/:threadId/reply',
  )
  async replyAsEmployee(
    @Param('threadId')
    threadId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    this.ensureAdmin(req);

    if (!body?.employeeId) {
      throw new UnauthorizedException(
        'Employee ID is required.',
      );
    }

    if (!body?.body?.trim()) {
      throw new UnauthorizedException(
        'Reply body is required.',
      );
    }

    return this.emailService.replyToThread(
      body.employeeId,
      threadId,
      body.body.trim(),
    );
  }

  private ensureAdmin(
    req: any,
  ): void {
    const role =
      req.user?.role;

    if (
      role !== 'ADMIN' &&
      role !== 'admin'
    ) {
      throw new UnauthorizedException(
        'Administrator access is required.',
      );
    }
  }
}