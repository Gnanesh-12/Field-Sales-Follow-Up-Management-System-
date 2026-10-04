// import { Injectable, Logger } from '@nestjs/common';
// import { google } from 'googleapis';
// import { GmailOAuthService } from './gmail-oauth.service';

// /**
//  * Gmail Service — handles sending emails via the Gmail API.
//  * 
//  * This service is responsible ONLY for the Gmail API interaction.
//  * Business logic (validation, logging, etc.) lives in EmailService.
//  * 
//  * Phase 1: Send-only. No inbox read/sync.
//  */
// @Injectable()
// export class GmailService {
//   private readonly logger = new Logger(GmailService.name);

//   constructor(private readonly gmailOAuthService: GmailOAuthService) {}

//   /**
//    * Send an email through the employee's connected Gmail account using the Gmail API.
//    * 
//    * Returns the Gmail message ID on success.
//    */
//   async listThreads(
//     employeeId: string,
//     query?: string,
//   ) {
//     const { client } =
//       await this.gmailOAuthService.getAuthenticatedClient(employeeId);

//     const gmail = google.gmail({
//       version: 'v1',
//       auth: client,
//     });

//     return gmail.users.threads.list({
//       userId: 'me',
//       q: query,
//       maxResults: 50,
//     });
//   }

//   async getThread(
//     employeeId: string,
//     threadId: string,
//   ) {
//     const { client } =
//       await this.gmailOAuthService.getAuthenticatedClient(employeeId);

//     const gmail = google.gmail({
//       version: 'v1',
//       auth: client,
//     });

//     return gmail.users.threads.get({
//       userId: 'me',
//       id: threadId,
//       format: 'full',
//     });
//   }

//   async getMessage(
//     employeeId: string,
//     messageId: string,
//   ) {
//     const { client } =
//       await this.gmailOAuthService.getAuthenticatedClient(employeeId);

//     const gmail = google.gmail({
//       version: 'v1',
//       auth: client,
//     });

//     return gmail.users.messages.get({
//       userId: 'me',
//       id: messageId,
//       format: 'full',
//     });
//   }

//   async sendEmail(
//     employeeId: string,
//     params: {
//       to: string;
//       cc?: string[];
//       subject: string;
//       body: string;
//       attachments?: Array<{
//         filename: string;
//         mimeType: string;
//         content: Buffer;
//       }>;
//     },
//   ): Promise<{ messageId: string; threadId: string }> {
//     const { client, gmailAddress } = await this.gmailOAuthService.getAuthenticatedClient(employeeId);
//     const gmail = google.gmail({ version: 'v1', auth: client });

//     // Build the MIME message
//     const mimeMessage = this.buildMimeMessage({
//       from: gmailAddress,
//       ...params,
//     });

//     // Encode in base64url format for Gmail API
//     const encodedMessage = Buffer.from(mimeMessage)
//       .toString('base64')
//       .replace(/\+/g, '-')
//       .replace(/\//g, '_')
//       .replace(/=+$/, '');

//     try {
//       const response = await gmail.users.messages.send({
//         userId: 'me',
//         requestBody: {
//           raw: encodedMessage,
//         },
//       });

//       this.logger.log(`Email sent via Gmail API for employee ${employeeId}, messageId: ${response.data.id}`);

//       return {
//         messageId: response.data.id || '',
//         threadId: response.data.threadId || '',
//       };
//     } catch (error) {
//       this.logger.error(`Gmail API send failed for employee ${employeeId}: ${error.message}`);

//       // Provide user-friendly error messages
//       if (error.code === 401 || error.code === 403) {
//         throw new Error('Gmail authorization has expired or been revoked. Please reconnect your Gmail account.');
//       }
//       if (error.code === 429) {
//         throw new Error('Gmail sending rate limit reached. Please try again in a few minutes.');
//       }
//       if (error.message?.includes('invalid_grant')) {
//         throw new Error('Gmail authorization has been revoked. Please reconnect your Gmail account.');
//       }

//       throw new Error(`Failed to send email via Gmail: ${error.message}`);
//     }
//   }

//   /**
//    * Build a MIME-formatted email message string.
//    * Supports plain text body, CC, and file attachments.
//    */
//   private buildMimeMessage(params: {
//     from: string;
//     to: string;
//     cc?: string[];
//     subject: string;
//     body: string;
//     attachments?: Array<{
//       filename: string;
//       mimeType: string;
//       content: Buffer;
//     }>;
//   }): string {
//     const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     const hasAttachments = params.attachments && params.attachments.length > 0;

//     let headers = [
//       `From: ${params.from}`,
//       `To: ${params.to}`,
//       ...(params.cc?.length ? [`Cc: ${params.cc.join(', ')}`] : []),
//       `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString('base64')}?=`,
//       'MIME-Version: 1.0',
//     ];

//     if (hasAttachments) {
//       headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

//       const parts: string[] = [];

//       // Text body part
//       parts.push([
//         `--${boundary}`,
//         'Content-Type: text/html; charset="UTF-8"',
//         'Content-Transfer-Encoding: base64',
//         '',
//         Buffer.from(this.textToHtml(params.body)).toString('base64'),
//       ].join('\r\n'));

//       // Attachment parts
//       for (const attachment of params.attachments!) {
//         parts.push([
//           `--${boundary}`,
//           `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
//           'Content-Transfer-Encoding: base64',
//           `Content-Disposition: attachment; filename="${attachment.filename}"`,
//           '',
//           attachment.content.toString('base64'),
//         ].join('\r\n'));
//       }

//       parts.push(`--${boundary}--`);

//       return headers.join('\r\n') + '\r\n\r\n' + parts.join('\r\n');
//     } else {
//       headers.push('Content-Type: text/html; charset="UTF-8"');
//       headers.push('Content-Transfer-Encoding: base64');

//       return headers.join('\r\n') + '\r\n\r\n' + Buffer.from(this.textToHtml(params.body)).toString('base64');
//     }
//   }

//   /**
//    * Convert plain text to basic HTML, preserving line breaks.
//    */
//   private textToHtml(text: string): string {
//     const escaped = text
//       .replace(/&/g, '&amp;')
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;')
//       .replace(/\n/g, '<br>');

//     return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">${escaped}</body></html>`;
//   }
// }

// import {
//   Injectable,
//   Logger,
// } from '@nestjs/common';

// import { google } from 'googleapis';

// import { GmailOAuthService } from './gmail-oauth.service';

// @Injectable()
// export class GmailService {
//   private readonly logger =
//     new Logger(GmailService.name);

//   constructor(
//     private readonly gmailOAuthService: GmailOAuthService,
//   ) {}

//   /**
//    * Send a normal new email.
//    */
//   async sendEmail(
//     employeeId: string,
//     params: {
//       to: string;
//       cc?: string[];
//       subject: string;
//       body: string;
//       attachments?: Array<{
//         filename: string;
//         mimeType: string;
//         content: Buffer;
//       }>;
//     },
//   ): Promise<{
//     messageId: string;
//     threadId: string;
//   }> {
//     const {
//       client,
//       gmailAddress,
//     } =
//       await this.gmailOAuthService.getAuthenticatedClient(
//         employeeId,
//       );

//     const gmail =
//       google.gmail({
//         version: 'v1',
//         auth: client,
//       });

//     const mimeMessage =
//       this.buildMimeMessage({
//         from: gmailAddress,
//         ...params,
//       });

//     const encodedMessage =
//       this.encodeBase64Url(
//         mimeMessage,
//       );

//     try {
//       const response =
//         await gmail.users.messages.send({
//           userId: 'me',
//           requestBody: {
//             raw: encodedMessage,
//           },
//         });

//       return {
//         messageId:
//           response.data.id || '',
//         threadId:
//           response.data.threadId || '',
//       };
//     } catch (error) {
//       this.handleGmailError(
//         error,
//         employeeId,
//       );
//     }
//   }

//   /**
//    * Reply to an existing Gmail conversation.
//    */
//   async replyToThread(
//     employeeId: string,
//     params: {
//       threadId: string;
//       to: string;
//       subject: string;
//       body: string;
//       inReplyTo?: string;
//       references?: string;
//     },
//   ): Promise<{
//     messageId: string;
//     threadId: string;
//   }> {
//     const {
//       client,
//       gmailAddress,
//     } =
//       await this.gmailOAuthService.getAuthenticatedClient(
//         employeeId,
//       );

//     const gmail =
//       google.gmail({
//         version: 'v1',
//         auth: client,
//       });

//     const headers = [
//       `From: ${gmailAddress}`,
//       `To: ${params.to}`,
//       `Subject: ${this.encodeHeader(params.subject)}`,
//       'MIME-Version: 1.0',
//       'Content-Type: text/html; charset="UTF-8"',
//       'Content-Transfer-Encoding: base64',
//     ];

//     if (params.inReplyTo) {
//       headers.push(
//         `In-Reply-To: ${params.inReplyTo}`,
//       );
//     }

//     if (params.references) {
//       headers.push(
//         `References: ${params.references}`,
//       );
//     } else if (params.inReplyTo) {
//       headers.push(
//         `References: ${params.inReplyTo}`,
//       );
//     }

//     const raw =
//       headers.join('\r\n') +
//       '\r\n\r\n' +
//       Buffer.from(
//         this.textToHtml(params.body),
//       ).toString('base64');

//     try {
//       const response =
//         await gmail.users.messages.send({
//           userId: 'me',
//           requestBody: {
//             raw: this.encodeBase64Url(raw),
//             threadId:
//               params.threadId,
//           },
//         });

//       return {
//         messageId:
//           response.data.id || '',
//         threadId:
//           response.data.threadId ||
//           params.threadId,
//       };
//     } catch (error) {
//       this.handleGmailError(
//         error,
//         employeeId,
//       );
//     }
//   }

//   /**
//    * Forward an existing email.
//    */
//   async forwardMessage(
//     employeeId: string,
//     params: {
//       to: string;
//       subject: string;
//       body: string;
//       originalBody?: string;
//     },
//   ): Promise<{
//     messageId: string;
//     threadId: string;
//   }> {
//     const {
//       client,
//       gmailAddress,
//     } =
//       await this.gmailOAuthService.getAuthenticatedClient(
//         employeeId,
//       );

//     const gmail =
//       google.gmail({
//         version: 'v1',
//         auth: client,
//       });

//     const forwardBody =
//       params.originalBody
//         ? `${params.body}\n\n---------- Forwarded message ----------\n\n${params.originalBody}`
//         : params.body;

//     const headers = [
//       `From: ${gmailAddress}`,
//       `To: ${params.to}`,
//       `Subject: ${this.encodeHeader(
//         params.subject.startsWith('Fwd:')
//           ? params.subject
//           : `Fwd: ${params.subject}`,
//       )}`,
//       'MIME-Version: 1.0',
//       'Content-Type: text/html; charset="UTF-8"',
//       'Content-Transfer-Encoding: base64',
//     ];

//     const raw =
//       headers.join('\r\n') +
//       '\r\n\r\n' +
//       Buffer.from(
//         this.textToHtml(
//           forwardBody,
//         ),
//       ).toString('base64');

//     try {
//       const response =
//         await gmail.users.messages.send({
//           userId: 'me',
//           requestBody: {
//             raw: this.encodeBase64Url(raw),
//           },
//         });

//       return {
//         messageId:
//           response.data.id || '',
//         threadId:
//           response.data.threadId || '',
//       };
//     } catch (error) {
//       this.handleGmailError(
//         error,
//         employeeId,
//       );
//     }
//   }

//   /**
//    * Mark a Gmail message as read.
//    */
//   async markMessageRead(
//     employeeId: string,
//     gmailMessageId: string,
//   ): Promise<void> {
//     const { client } =
//       await this.gmailOAuthService.getAuthenticatedClient(
//         employeeId,
//       );

//     const gmail =
//       google.gmail({
//         version: 'v1',
//         auth: client,
//       });

//     await gmail.users.messages.modify({
//       userId: 'me',
//       id: gmailMessageId,
//       requestBody: {
//         removeLabelIds: ['UNREAD'],
//       },
//     });
//   }

//   /**
//    * Build a MIME message.
//    */
//   private buildMimeMessage(params: {
//     from: string;
//     to: string;
//     cc?: string[];
//     subject: string;
//     body: string;
//     attachments?: Array<{
//       filename: string;
//       mimeType: string;
//       content: Buffer;
//     }>;
//   }): string {
//     const boundary =
//       `boundary_${Date.now()}_${Math.random()
//         .toString(36)
//         .substring(2, 11)}`;

//     const hasAttachments =
//       !!params.attachments?.length;

//     const headers = [
//       `From: ${params.from}`,
//       `To: ${params.to}`,
//       ...(params.cc?.length
//         ? [
//             `Cc: ${params.cc.join(', ')}`,
//           ]
//         : []),
//       `Subject: ${this.encodeHeader(
//         params.subject,
//       )}`,
//       'MIME-Version: 1.0',
//     ];

//     if (hasAttachments) {
//       headers.push(
//         `Content-Type: multipart/mixed; boundary="${boundary}"`,
//       );

//       const parts: string[] = [];

//       parts.push(
//         [
//           `--${boundary}`,
//           'Content-Type: text/html; charset="UTF-8"',
//           'Content-Transfer-Encoding: base64',
//           '',
//           Buffer.from(
//             this.textToHtml(
//               params.body,
//             ),
//           ).toString('base64'),
//         ].join('\r\n'),
//       );

//       for (
//         const attachment of
//           params.attachments!
//       ) {
//         parts.push(
//           [
//             `--${boundary}`,
//             `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
//             'Content-Transfer-Encoding: base64',
//             `Content-Disposition: attachment; filename="${attachment.filename}"`,
//             '',
//             attachment.content.toString(
//               'base64',
//             ),
//           ].join('\r\n'),
//         );
//       }

//       parts.push(
//         `--${boundary}--`,
//       );

//       return (
//         headers.join('\r\n') +
//         '\r\n\r\n' +
//         parts.join('\r\n')
//       );
//     }

//     headers.push(
//       'Content-Type: text/html; charset="UTF-8"',
//     );

//     headers.push(
//       'Content-Transfer-Encoding: base64',
//     );

//     return (
//       headers.join('\r\n') +
//       '\r\n\r\n' +
//       Buffer.from(
//         this.textToHtml(
//           params.body,
//         ),
//       ).toString('base64')
//     );
//   }

//   private encodeHeader(
//     value: string,
//   ): string {
//     return `=?UTF-8?B?${Buffer.from(
//       value,
//     ).toString('base64')}?=`;
//   }

//   private encodeBase64Url(
//     value: string,
//   ): string {
//     return Buffer.from(value)
//       .toString('base64')
//       .replace(/\+/g, '-')
//       .replace(/\//g, '_')
//       .replace(/=+$/, '');
//   }

//   private textToHtml(
//     text: string,
//   ): string {
//     const escaped =
//       text
//         .replace(
//           /&/g,
//           '&amp;',
//         )
//         .replace(
//           /</g,
//           '&lt;',
//         )
//         .replace(
//           />/g,
//           '&gt;',
//         )
//         .replace(
//           /\n/g,
//           '<br>',
//         );

//     return `
//       <!DOCTYPE html>
//       <html>
//         <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
//           ${escaped}
//         </body>
//       </html>
//     `;
//   }

//   private handleGmailError(
//     error: any,
//     employeeId: string,
//   ): never {
//     this.logger.error(
//       `Gmail API operation failed for employee ${employeeId}: ${error?.message}`,
//     );

//     if (
//       error?.code === 401 ||
//       error?.code === 403
//     ) {
//       throw new Error(
//         'Gmail authorization has expired or been revoked. Please reconnect your Gmail account.',
//       );
//     }

//     if (
//       error?.code === 429
//     ) {
//       throw new Error(
//         'Gmail rate limit reached. Please try again later.',
//       );
//     }

//     throw new Error(
//       `Gmail API operation failed: ${error?.message || 'Unknown error'}`,
//     );
//   }
// }


import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { google } from 'googleapis';

import { GmailOAuthService } from './gmail-oauth.service';

@Injectable()
export class GmailService {
  private readonly logger =
    new Logger(GmailService.name);

  /**
   * Every email created by Kshetra is marked with this subject prefix.
   *
   * This allows Kshetra to distinguish application-related emails
   * from unrelated emails in the employee's Gmail account.
   */
  static readonly KSHETRA_MARKER = '[KSHETRA]';

  constructor(
    private readonly gmailOAuthService: GmailOAuthService,
  ) {}

  /**
   * Send a new Kshetra email.
   *
   * The subject is automatically prefixed with [KSHETRA].
   */
  async sendEmail(
    employeeId: string,
    params: {
      to: string;
      cc?: string[];
      subject: string;
      body: string;
      attachments?: Array<{
        filename: string;
        mimeType: string;
        content: Buffer;
      }>;
    },
  ): Promise<{
    messageId: string;
    threadId: string;
  }> {
    const {
      client,
      gmailAddress,
    } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    const subject =
      this.ensureKshetraSubject(params.subject);

    const mimeMessage =
      this.buildMimeMessage({
        from: gmailAddress,
        ...params,
        subject,
      });

    const encodedMessage =
      this.encodeBase64Url(mimeMessage);

    try {
      const response =
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });

      this.logger.log(
        `Kshetra email sent for employee ${employeeId}, messageId=${response.data.id}`,
      );

      return {
        messageId:
          response.data.id || '',
        threadId:
          response.data.threadId || '',
      };
    } catch (error) {
      this.handleGmailError(
        error,
        employeeId,
      );
    }
  }

  /**
   * Reply to an existing Kshetra Gmail conversation.
   */
  async replyToThread(
    employeeId: string,
    params: {
      threadId: string;
      to: string;
      subject: string;
      body: string;
      inReplyTo?: string;
      references?: string;
    },
  ): Promise<{
    messageId: string;
    threadId: string;
  }> {
    const {
      client,
      gmailAddress,
    } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    const subject =
      this.ensureKshetraSubject(
        params.subject,
      );

    const headers = [
      `From: ${gmailAddress}`,
      `To: ${params.to}`,
      `Subject: ${this.encodeHeader(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
    ];

    if (params.inReplyTo) {
      headers.push(
        `In-Reply-To: ${params.inReplyTo}`,
      );
    }

    if (params.references) {
      headers.push(
        `References: ${params.references}`,
      );
    } else if (params.inReplyTo) {
      headers.push(
        `References: ${params.inReplyTo}`,
      );
    }

    const raw =
      headers.join('\r\n') +
      '\r\n\r\n' +
      Buffer.from(
        this.textToHtml(params.body),
      ).toString('base64');

    try {
      const response =
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: this.encodeBase64Url(raw),
            threadId: params.threadId,
          },
        });

      this.logger.log(
        `Kshetra reply sent for employee ${employeeId}, threadId=${params.threadId}`,
      );

      return {
        messageId:
          response.data.id || '',
        threadId:
          response.data.threadId ||
          params.threadId,
      };
    } catch (error) {
      this.handleGmailError(
        error,
        employeeId,
      );
    }
  }

  /**
   * Forward an existing Kshetra email.
   */
  async forwardMessage(
    employeeId: string,
    params: {
      to: string;
      subject: string;
      body: string;
      originalBody?: string;
    },
  ): Promise<{
    messageId: string;
    threadId: string;
  }> {
    const {
      client,
      gmailAddress,
    } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    const forwardBody =
      params.originalBody
        ? `${params.body}\n\n---------- Forwarded message ----------\n\n${params.originalBody}`
        : params.body;

    let forwardSubject =
      params.subject;

    if (
      !forwardSubject
        .toLowerCase()
        .startsWith('fwd:')
    ) {
      forwardSubject =
        `Fwd: ${forwardSubject}`;
    }

    forwardSubject =
      this.ensureKshetraSubject(
        forwardSubject,
      );

    const headers = [
      `From: ${gmailAddress}`,
      `To: ${params.to}`,
      `Subject: ${this.encodeHeader(
        forwardSubject,
      )}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
    ];

    const raw =
      headers.join('\r\n') +
      '\r\n\r\n' +
      Buffer.from(
        this.textToHtml(
          forwardBody,
        ),
      ).toString('base64');

    try {
      const response =
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: this.encodeBase64Url(raw),
          },
        });

      this.logger.log(
        `Kshetra email forwarded for employee ${employeeId}`,
      );

      return {
        messageId:
          response.data.id || '',
        threadId:
          response.data.threadId || '',
      };
    } catch (error) {
      this.handleGmailError(
        error,
        employeeId,
      );
    }
  }

  /**
   * Mark a Gmail message as read.
   */
  async markMessageRead(
    employeeId: string,
    gmailMessageId: string,
  ): Promise<void> {
    const { client } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: gmailMessageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      this.handleGmailError(
        error,
        employeeId,
      );
    }
  }

  /**
   * List only Kshetra-related Gmail threads.
   *
   * This method is intentionally restricted to emails whose
   * subject contains [KSHETRA].
   *
   * Unrelated Gmail messages are NOT returned.
   */
  async listKshetraThreads(
    employeeId: string,
    additionalQuery?: string,
  ) {
    const { client } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    const queries = [
      `subject:"${GmailService.KSHETRA_MARKER}"`,
    ];

    if (additionalQuery?.trim()) {
      queries.push(
        additionalQuery.trim(),
      );
    }

    return gmail.users.threads.list({
      userId: 'me',
      q: queries.join(' '),
      maxResults: 50,
    });
  }

  /**
   * Get a Gmail thread.
   */
  async getThread(
    employeeId: string,
    threadId: string,
  ) {
    const { client } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    return gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });
  }

  /**
   * Get a Gmail message.
   */
  async getMessage(
    employeeId: string,
    messageId: string,
  ) {
    const { client } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    return gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
  }

  /**
   * Check whether a subject belongs to Kshetra.
   */
  isKshetraSubject(
    subject?: string | null,
  ): boolean {
    if (!subject) {
      return false;
    }

    return subject
      .toLowerCase()
      .includes(
        GmailService.KSHETRA_MARKER.toLowerCase(),
      );
  }

  /**
   * Make sure an outgoing subject contains [KSHETRA].
   */
  private ensureKshetraSubject(
    subject: string,
  ): string {
    const cleanSubject =
      (subject || '').trim();

    if (
      this.isKshetraSubject(
        cleanSubject,
      )
    ) {
      return cleanSubject;
    }

    return `${GmailService.KSHETRA_MARKER} ${cleanSubject}`;
  }

  /**
   * Build MIME-formatted email.
   */
  private buildMimeMessage(
    params: {
      from: string;
      to: string;
      cc?: string[];
      subject: string;
      body: string;
      attachments?: Array<{
        filename: string;
        mimeType: string;
        content: Buffer;
      }>;
    },
  ): string {
    const boundary =
      `boundary_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;

    const hasAttachments =
      !!params.attachments?.length;

    const headers = [
      `From: ${params.from}`,
      `To: ${params.to}`,
      ...(params.cc?.length
        ? [
            `Cc: ${params.cc.join(', ')}`,
          ]
        : []),
      `Subject: ${this.encodeHeader(
        params.subject,
      )}`,
      'MIME-Version: 1.0',
    ];

    if (hasAttachments) {
      headers.push(
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
      );

      const parts: string[] = [];

      /**
       * Main body.
       */
      parts.push(
        [
          `--${boundary}`,
          'Content-Type: text/html; charset="UTF-8"',
          'Content-Transfer-Encoding: base64',
          '',
          Buffer.from(
            this.textToHtml(
              params.body,
            ),
          ).toString('base64'),
        ].join('\r\n'),
      );

      /**
       * Attachments.
       */
      for (
        const attachment of
          params.attachments!
      ) {
        parts.push(
          [
            `--${boundary}`,
            `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: attachment; filename="${attachment.filename}"`,
            '',
            attachment.content.toString(
              'base64',
            ),
          ].join('\r\n'),
        );
      }

      parts.push(
        `--${boundary}--`,
      );

      return (
        headers.join('\r\n') +
        '\r\n\r\n' +
        parts.join('\r\n')
      );
    }

    headers.push(
      'Content-Type: text/html; charset="UTF-8"',
    );

    headers.push(
      'Content-Transfer-Encoding: base64',
    );

    return (
      headers.join('\r\n') +
      '\r\n\r\n' +
      Buffer.from(
        this.textToHtml(
          params.body,
        ),
      ).toString('base64')
    );
  }

  /**
   * Encode an email header using UTF-8 Base64.
   */
  private encodeHeader(
    value: string,
  ): string {
    return `=?UTF-8?B?${Buffer.from(
      value,
    ).toString('base64')}?=`;
  }

  /**
   * Encode Gmail API raw message as base64url.
   */
  private encodeBase64Url(
    value: string,
  ): string {
    return Buffer.from(value)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Convert plain text into safe HTML.
   */
  private textToHtml(
    text: string,
  ): string {
    const escaped =
      text
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

    return `
      <!DOCTYPE html>
      <html>
        <body
          style="
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
          "
        >
          ${escaped}
        </body>
      </html>
    `;
  }

  /**
   * Convert Gmail API errors into application-friendly errors.
   */
  private handleGmailError(
    error: any,
    employeeId: string,
  ): never {
    this.logger.error(
      `Gmail API operation failed for employee ${employeeId}: ${
        error?.message || error
      }`,
    );

    if (
      error?.code === 401 ||
      error?.code === 403
    ) {
      throw new Error(
        'Gmail authorization has expired or been revoked. Please reconnect your Gmail account.',
      );
    }

    if (
      error?.code === 429
    ) {
      throw new Error(
        'Gmail rate limit reached. Please try again later.',
      );
    }

    if (
      error?.message?.includes(
        'invalid_grant',
      )
    ) {
      throw new Error(
        'Gmail authorization has been revoked. Please reconnect your Gmail account.',
      );
    }

    throw new Error(
      `Gmail API operation failed: ${
        error?.message ||
        'Unknown error'
      }`,
    );
  }
}