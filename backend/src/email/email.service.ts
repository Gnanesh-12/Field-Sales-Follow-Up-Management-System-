import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GmailService } from './gmail.service';
import { GmailOAuthService } from './gmail-oauth.service';
import { MailpitService } from './mailpit.service';
import { SendEmailDto, SendVisitReportDto } from './dto/send-email.dto';
import { GmailSyncService } from './gmail-sync.service';

/**
 * Email Service — orchestrates email sending, validation, and logging.
 * 
 * Delegates to GmailService (production) or MailpitService (development)
 * based on the EMAIL_PROVIDER environment variable.
 * 
 * Handles:
 * - Input validation (email format, attachments, permissions)
 * - Fetching attachment data from Vercel Blob URLs
 * - Creating EmailLog records
 * - Building visit report email content
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailProvider: string;

  // Attachment limits
  private readonly MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB per attachment
  private readonly MAX_TOTAL_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB total
  private readonly ALLOWED_ATTACHMENT_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly gmailService: GmailService,
    private readonly gmailOAuthService: GmailOAuthService,
    private readonly mailpitService: MailpitService,
    private readonly gmailSyncService: GmailSyncService,
  ) {
    this.emailProvider = this.configService.get<string>('EMAIL_PROVIDER') || 'gmail';
    this.logger.log(`Email provider: ${this.emailProvider}`);
  }

  /**
   * Send an email from an employee to a customer or arbitrary recipient.
   * 
   * SECURITY:
   * - Validates employee has Gmail connected
   * - Validates recipient email format
   * - Validates attachment permissions (employee can only attach their own visit photos)
   * - Creates audit log in EmailLog
   */
  async sendEmail(employeeId: string, dto: SendEmailDto): Promise<{
    id: string;
    status: string;
    gmailMessageId?: string;
  }> {
    // Validate recipient email format
    if (!this.isValidEmail(dto.to)) {
      throw new BadRequestException('Invalid recipient email address.');
    }

    // Validate CC emails
    if (dto.cc?.length) {
      for (const cc of dto.cc) {
        if (!this.isValidEmail(cc)) {
          throw new BadRequestException(`Invalid CC email address: ${cc}`);
        }
      }
    }

    if (!dto.subject?.trim()) {
      throw new BadRequestException('Email subject is required.');
    }

    if (!dto.body?.trim()) {
      throw new BadRequestException('Email body is required.');
    }

    // Verify employee exists and is active
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found.');
    if (employee.status === 'INACTIVE') throw new ForbiddenException('Your account is deactivated.');

    // Resolve customer site if provided
    let customerSiteId: string | undefined;
    if (dto.customerSiteId) {
      const site = await this.prisma.customerSite.findUnique({ where: { id: dto.customerSiteId } });
      if (!site) throw new NotFoundException('Customer site not found.');
      customerSiteId = site.id;
    }

    // Fetch attachments from URLs (existing Vercel Blob URLs)
    const attachments = await this.resolveAttachments(employeeId, dto.attachmentUrls || []);

    // Get sender email
    let senderEmail = 'unknown@kshetra.local';
    if (this.emailProvider === 'gmail') {
      const status = await this.gmailOAuthService.getConnectionStatus(employeeId);
      if (!status.connected) {
        throw new BadRequestException('Gmail is not connected. Please connect your Gmail account first.');
      }
      senderEmail = status.gmailAddress!;
    } else {
      senderEmail = `${employeeId}@kshetra.local`;
    }

    // Create email log with QUEUED status
    const emailLog = await this.prisma.emailLog.create({
      data: {
        employeeId,
        customerSiteId: customerSiteId || null,
        senderEmail,
        recipientEmail: dto.to,
        ccEmails: dto.cc || [],
        subject: dto.subject,
        bodyPreview: dto.body.substring(0, 200),
        status: 'QUEUED',
        attachmentCount: attachments.length,
      },
    });

    try {
      let gmailMessageId: string | undefined;

      if (this.emailProvider === 'mailpit') {
        // Send via Mailpit for local testing
        const result = await this.mailpitService.sendEmail({
          from: senderEmail,
          to: dto.to,
          cc: dto.cc,
          subject: dto.subject,
          body: dto.body,
          attachments: attachments.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.mimeType,
          })),
        });
        gmailMessageId = result.messageId;
      } else {
        // Send via Gmail API
        const result = await this.gmailService.sendEmail(employeeId, {
          to: dto.to,
          cc: dto.cc,
          subject: dto.subject,
          body: dto.body,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        gmailMessageId = result.messageId;
      }

      // Update log to SENT (Note: SENT means API accepted it, not confirmed delivery)
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'SENT',
          gmailMessageId,
          sentAt: new Date(),
        },
      });

      return { id: emailLog.id, status: 'SENT', gmailMessageId };
    } catch (error) {
      // Update log to FAILED
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message?.substring(0, 500),
        },
      });

      throw error;
    }
  }

  /**
   * Send a field visit report email.
   * 
   * SECURITY:
   * - Validates employee owns the field visit
   * - Only includes photos from the employee's own visits
   */
  async sendVisitReport(employeeId: string, dto: SendVisitReportDto): Promise<{
    id: string;
    status: string;
    gmailMessageId?: string;
  }> {
    // Validate recipient
    if (!this.isValidEmail(dto.recipientEmail)) {
      throw new BadRequestException('Invalid recipient email address.');
    }

    // Fetch the field visit with all related data
    const visit = await this.prisma.fieldVisit.findFirst({
      where: { id: dto.fieldVisitId, employeeId },
      include: {
        site: true,
        location: true,
        attachments: true,
        materials: { include: { material: true } },
        followUps: true,
        employee: { select: { name: true, id: true } },
      },
    });

    if (!visit) {
      throw new NotFoundException('Field visit not found or you do not have permission to access it.');
    }

    // Build the visit report email body
    const reportBody = this.buildVisitReportBody(visit, dto.additionalNotes);

    // Prepare attachments (field visit photos)
    let attachments: Array<{ filename: string; mimeType: string; content: Buffer }> = [];
    if (dto.includePhotos && visit.attachments.length > 0) {
      attachments = await this.fetchVisitPhotos(visit.attachments);
    }

    const subject = `Field Visit Report — ${visit.site?.name || 'Unknown Site'} — ${new Date(visit.timestamp).toLocaleDateString()}`;

    // Send using the generic send method
    return this.sendEmail(employeeId, {
      to: dto.recipientEmail,
      cc: dto.cc,
      subject,
      body: reportBody,
      customerSiteId: visit.customerSiteId,
      attachmentUrls: [], // Photos are handled separately above
    });
  }

  /**
   * Get email history for an employee (paginated).
   * 
   * SECURITY: Employee can only see their own email history.
   */
  async getEmailHistory(employeeId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [emails, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where: { employeeId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          recipientEmail: true,
          subject: true,
          status: true,
          sentAt: true,
          createdAt: true,
          isVisitReport: true,
          attachmentCount: true,
          customerSite: {
            select: { id: true, name: true },
          },
          fieldVisitId: true,
        },
      }),
      this.prisma.emailLog.count({ where: { employeeId } }),
    ]);

    return { emails, total, page, limit };
  }

  /**
   * Get a single email detail.
   * 
   * SECURITY: Employee can only see their own emails.
   */
  async getEmailDetail(employeeId: string, emailId: string) {
    const email = await this.prisma.emailLog.findFirst({
      where: { id: emailId, employeeId },
      include: {
        customerSite: { select: { id: true, name: true } },
      },
    });

    if (!email) {
      throw new NotFoundException('Email not found.');
    }

    // Never expose gmailMessageId details beyond existence
    return {
      id: email.id,
      senderEmail: email.senderEmail,
      recipientEmail: email.recipientEmail,
      ccEmails: email.ccEmails,
      subject: email.subject,
      bodyPreview: email.bodyPreview,
      status: email.status,
      errorMessage: email.status === 'FAILED' ? email.errorMessage : undefined,
      attachmentCount: email.attachmentCount,
      isVisitReport: email.isVisitReport,
      fieldVisitId: email.fieldVisitId,
      customerSite: email.customerSite,
      sentAt: email.sentAt,
      createdAt: email.createdAt,
    };
  }

  // ─── Private Helpers ───────────────────────────────────────────

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Resolve attachment URLs to actual file content.
   * Validates that the employee has permission to attach these files.
   */
  private async resolveAttachments(
    employeeId: string,
    urls: string[],
  ): Promise<Array<{ filename: string; mimeType: string; content: Buffer }>> {
    if (!urls.length) return [];

    const attachments: Array<{ filename: string; mimeType: string; content: Buffer }> = [];
    let totalSize = 0;

    for (const url of urls) {
      try {
        // Validate URL — must be from Vercel Blob or our uploads
        if (!this.isAllowedAttachmentUrl(url)) {
          throw new BadRequestException(`Attachment URL not allowed: ${url}`);
        }

        // Verify the employee has access to this attachment
        // Check if the URL belongs to one of their field visit attachments
        const attachment = await this.prisma.attachment.findFirst({
          where: {
            fileUrl: url,
            visit: { employeeId },
          },
        });

        // Allow if it's an employee's own attachment, or if it's a general upload URL
        // that doesn't belong to a specific visit
        if (!attachment && url.includes('site-photos/')) {
          throw new ForbiddenException('You do not have permission to attach this file.');
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch attachment: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // Validate file size
        if (buffer.length > this.MAX_ATTACHMENT_SIZE) {
          throw new BadRequestException(`Attachment too large (max ${this.MAX_ATTACHMENT_SIZE / 1024 / 1024}MB): ${url}`);
        }

        totalSize += buffer.length;
        if (totalSize > this.MAX_TOTAL_ATTACHMENT_SIZE) {
          throw new BadRequestException(`Total attachment size exceeds ${this.MAX_TOTAL_ATTACHMENT_SIZE / 1024 / 1024}MB limit.`);
        }

        // Extract filename from URL
        const filename = url.split('/').pop() || 'attachment';

        attachments.push({
          filename,
          mimeType: contentType,
          content: buffer,
        });
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof ForbiddenException) {
          throw error;
        }
        this.logger.error(`Failed to resolve attachment ${url}: ${error.message}`);
        throw new BadRequestException(`Failed to process attachment: ${error.message}`);
      }
    }

    return attachments;
  }

  /**
   * Fetch field visit photo attachments for inclusion in report emails.
   */
  private async fetchVisitPhotos(
    visitAttachments: Array<{ fileUrl: string; type: string }>,
  ): Promise<Array<{ filename: string; mimeType: string; content: Buffer }>> {
    const photos: Array<{ filename: string; mimeType: string; content: Buffer }> = [];

    for (const att of visitAttachments) {
      if (att.type !== 'image') continue;

      try {
        const response = await fetch(att.fileUrl);
        if (!response.ok) continue;

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const filename = att.fileUrl.split('/').pop() || 'visit-photo.jpg';

        // Skip if too large (don't block the whole report)
        if (buffer.length > this.MAX_ATTACHMENT_SIZE) {
          this.logger.warn(`Skipping oversized photo: ${filename}`);
          continue;
        }

        photos.push({ filename, mimeType: contentType, content: buffer });
      } catch (error) {
        this.logger.warn(`Failed to fetch visit photo ${att.fileUrl}: ${error.message}`);
        // Continue with remaining photos
      }
    }

    return photos;
  }

  private isAllowedAttachmentUrl(url: string): boolean {
    // Allow Vercel Blob URLs and relative upload URLs
    return (
      url.startsWith('https://') ||
      url.startsWith('http://localhost') ||
      url.startsWith('http://10.0.2.2') ||
      url.startsWith('/uploads/')
    );
  }

  /**
   * Build the HTML body for a field visit report email.
   */
  private buildVisitReportBody(visit: any, additionalNotes?: string): string {
    const lines: string[] = [];

    lines.push('FIELD VISIT REPORT');
    lines.push('═══════════════════════════════════════');
    lines.push('');
    lines.push(`Visit ID: ${visit.id}`);
    lines.push(`Employee: ${visit.employee?.name || visit.employeeId} (${visit.employeeId})`);
    lines.push(`Date: ${new Date(visit.timestamp).toLocaleString()}`);
    lines.push('');
    lines.push('── Customer Details ──');
    lines.push(`Customer/Site: ${visit.site?.name || 'Unknown'}`);
    lines.push(`Address: ${visit.site?.address || 'N/A'}`);
    lines.push('');

    if (visit.location) {
      lines.push('── Visit Location ──');
      lines.push(`GPS: ${visit.location.lat}, ${visit.location.lng}`);
      if (visit.location.accuracy) {
        lines.push(`Accuracy: ${visit.location.accuracy}m`);
      }
      lines.push('');
    }

    if (visit.notes || visit.remarks) {
      lines.push('── Notes / Remarks ──');
      if (visit.notes) lines.push(visit.notes);
      if (visit.remarks) lines.push(visit.remarks);
      lines.push('');
    }

    if (visit.materials?.length > 0) {
      lines.push('── Materials Supplied ──');
      for (const m of visit.materials) {
        lines.push(`• ${m.material?.name || 'Unknown'}: ${m.quantity} ${m.material?.unit || ''}`);
      }
      lines.push('');
    }

    if (visit.followUps?.length > 0) {
      lines.push('── Follow-ups ──');
      for (const f of visit.followUps) {
        lines.push(`• Due: ${new Date(f.dueDate).toLocaleDateString()} — Status: ${f.status}`);
        if (f.notes) lines.push(`  Notes: ${f.notes}`);
      }
      lines.push('');
    }

    lines.push(`Status: ${visit.status}`);
    lines.push('');

    if (additionalNotes) {
      lines.push('── Additional Notes ──');
      lines.push(additionalNotes);
      lines.push('');
    }

    lines.push('═══════════════════════════════════════');
    lines.push('Sent via Kshetra Field Sales Management System');

    return lines.join('\n');
  }
    // ============================================================
  // PHASE 2 — EMAIL INBOX / THREADS
  // ============================================================

  // async getEmployeeEmailThreads(
  //   employeeId: string,
  // ) {
  //   const employee =
  //     await this.prisma.employee.findUnique({
  //       where: {
  //         id: employeeId,
  //       },
  //       select: {
  //         id: true,
  //         name: true,
  //       },
  //     });

  //   if (!employee) {
  //     throw new NotFoundException(
  //       'Employee not found.',
  //     );
  //   }

  //   return this.prisma.emailThread.findMany({
  //     where: {
  //       employeeId,
  //     },
  //     include: {
  //       customerSite: {
  //         select: {
  //           id: true,
  //           name: true,
  //           email: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       lastMessageAt: 'desc',
  //     },
  //   });
  // }

  async getEmployeeEmailThreads(
    employeeId: string,
    page = 1,
    limit = 30,
    customerSiteId?: string,
  ) {
    const employee =
      await this.prisma.employee.findUnique({
        where: {
          id: employeeId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Employee not found.',
      );
    }

    const where: any = { employeeId };
    if (customerSiteId) {
      where.customerSiteId = customerSiteId;
    }

    const [threads, total] = await Promise.all([
      this.prisma.emailThread.findMany({
        where,
        include: {
          customerSite: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.emailThread.count({ where }),
    ]);

    return {
      threads,
      total,
      page,
      limit,
    };
  }

  async getEmailThread(
    employeeId: string,
    threadId: string,
  ) {
    const thread =
      await this.prisma.emailThread.findFirst({
        where: {
          id: threadId,
          employeeId,
        },
        include: {
          customerSite: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: {
              sentAt: 'asc',
            },
          },
        },
      });

    if (!thread) {
      throw new NotFoundException(
        'Email conversation not found.',
      );
    }

    return thread;
  }

  async getThreadForAdmin(
    threadId: string,
  ) {
    const thread =
      await this.prisma.emailThread.findUnique({
        where: {
          id: threadId,
        },
        include: {
          customerSite: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: {
              sentAt: 'asc',
            },
          },
        },
      });

    if (!thread) {
      throw new NotFoundException(
        'Email conversation not found.',
      );
    }

    return thread;
  }

  async syncEmployeeEmail(
    employeeId: string,
  ) {
    return this.gmailSyncService.syncEmployee(
      employeeId,
    );
  }

  async replyToThread(
    employeeId: string,
    threadId: string,
    body: string,
  ) {
    if (!body?.trim()) {
      throw new BadRequestException(
        'Reply body is required.',
      );
    }

    const thread =
      await this.prisma.emailThread.findFirst({
        where: {
          id: threadId,
          employeeId,
        },
        include: {
          messages: {
            orderBy: {
              sentAt: 'desc',
            },
            take: 1,
          },
        },
      });

    if (!thread) {
      throw new NotFoundException(
        'Email conversation not found.',
      );
    }

    const latestMessage =
      thread.messages[0];

    if (!latestMessage) {
      throw new BadRequestException(
        'This conversation has no messages.',
      );
    }

    const to =
      latestMessage.fromEmail;

    if (!this.isValidEmail(to)) {
      throw new BadRequestException(
        'Customer email address is invalid.',
      );
    }

    const subject =
      latestMessage.subject ||
      thread.subject ||
      'Email conversation';

    const replySubject =
      subject
        .toLowerCase()
        .startsWith('re:')
        ? subject
        : `Re: ${subject}`;

    const result =
      await this.gmailService.replyToThread(
        employeeId,
        {
          threadId:
            thread.gmailThreadId,
          to,
          subject:
            replySubject,
          body,
          inReplyTo:
            latestMessage.messageId ||
            undefined,
          references:
            latestMessage.references ||
            latestMessage.messageId ||
            undefined,
        },
      );

    const senderConnection =
      await this.prisma.gmailConnection.findUnique({
        where: {
          employeeId,
        },
        select: {
          gmailAddress: true,
        },
      });

    if (!senderConnection) {
      throw new BadRequestException(
        'Gmail connection not found.',
      );
    }

    const sentAt =
      new Date();

    const message =
      await this.prisma.emailMessage.create({
        data: {
          threadId:
            thread.id,

          employeeId,

          gmailMessageId:
            result.messageId,

          gmailThreadId:
            result.threadId ||
            thread.gmailThreadId,

          direction:
            'OUTBOUND',

          fromEmail:
            senderConnection.gmailAddress,

          toEmails: [
            to,
          ],

          ccEmails: [],

          subject:
            replySubject,

          bodyText:
            body,

          bodyHtml:
            this.plainTextToHtml(
              body,
            ),

          snippet:
            body.substring(
              0,
              200,
            ),

          isRead:
            true,

          sentAt,
        },
      });

    await this.prisma.emailThread.update({
      where: {
        id: thread.id,
      },
      data: {
        subject:
          replySubject,

        lastMessageAt:
          sentAt,

        unreadCount: 0,
      },
    });

    return {
      success: true,
      message,
    };
  }

  async forwardMessage(
    employeeId: string,
    messageId: string,
    to: string,
    body: string,
  ) {
    if (!this.isValidEmail(to)) {
      throw new BadRequestException(
        'Invalid recipient email address.',
      );
    }

    const original =
      await this.prisma.emailMessage.findFirst({
        where: {
          id: messageId,
          employeeId,
        },
      });

    if (!original) {
      throw new NotFoundException(
        'Email message not found.',
      );
    }

    const subject =
      original.subject ||
      'Email';

    const originalBody =
      original.bodyText ||
      '';

    const result =
      await this.gmailService.forwardMessage(
        employeeId,
        {
          to,
          subject,
          body,
          originalBody,
        },
      );

    const senderConnection =
      await this.prisma.gmailConnection.findUnique({
        where: {
          employeeId,
        },
        select: {
          gmailAddress: true,
        },
      });

    if (!senderConnection) {
      throw new BadRequestException(
        'Gmail connection not found.',
      );
    }

    const sentAt =
      new Date();

    const forwardSubject =
      subject
        .toLowerCase()
        .startsWith('fwd:')
        ? subject
        : `Fwd: ${subject}`;

    const thread =
      await this.prisma.emailThread.create({
        data: {
          employeeId,

          customerSiteId:
            null,

          gmailThreadId:
            result.threadId,

          subject:
            forwardSubject,

          participants: [
            senderConnection.gmailAddress,
            to,
          ],

          lastMessageAt:
            sentAt,

          unreadCount: 0,
        },
      });

    const message =
      await this.prisma.emailMessage.create({
        data: {
          threadId:
            thread.id,

          employeeId,

          gmailMessageId:
            result.messageId,

          gmailThreadId:
            result.threadId,

          direction:
            'OUTBOUND',

          fromEmail:
            senderConnection.gmailAddress,

          toEmails: [
            to,
          ],

          ccEmails: [],

          subject:
            forwardSubject,

          bodyText:
            body,

          bodyHtml:
            this.plainTextToHtml(
              body,
            ),

          snippet:
            body.substring(
              0,
              200,
            ),

          isRead:
            true,

          sentAt,
        },
      });

    return {
      success: true,
      message,
    };
  }

  async markThreadRead(
    employeeId: string,
    threadId: string,
  ) {
    const thread =
      await this.prisma.emailThread.findFirst({
        where: {
          id: threadId,
          employeeId,
        },
        include: {
          messages: true,
        },
      });

    if (!thread) {
      throw new NotFoundException(
        'Email conversation not found.',
      );
    }

    const unreadMessages =
      thread.messages.filter(
        (message) =>
          !message.isRead &&
          message.direction ===
            'INBOUND',
      );

    for (
      const message of
        unreadMessages
    ) {
      try {
        await this.gmailService.markMessageRead(
          employeeId,
          message.gmailMessageId,
        );
      } catch (error) {
        this.logger.warn(
          `Could not mark Gmail message as read: ${error.message}`,
        );
      }

      await this.prisma.emailMessage.update({
        where: {
          id: message.id,
        },
        data: {
          isRead: true,
        },
      });
    }

    await this.prisma.emailThread.update({
      where: {
        id: thread.id,
      },
      data: {
        unreadCount: 0,
      },
    });

    return {
      success: true,
    };
  }

  private plainTextToHtml(
    text: string,
  ): string {
    return text
      .replace(
        /&/g,
        '&amp;',
      )
      .replace(
        /</g,
        '&lt;',
      )
      .replace(
        />/g,
        '&gt;',
      )
      .replace(
        /\n/g,
        '<br>',
      );
  }
}
