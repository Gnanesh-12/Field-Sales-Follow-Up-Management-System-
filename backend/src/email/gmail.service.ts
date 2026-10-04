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

  constructor(
    private readonly gmailOAuthService: GmailOAuthService,
  ) {}

  /**
   * Send a normal new email.
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

    const gmail =
      google.gmail({
        version: 'v1',
        auth: client,
      });

    const mimeMessage =
      this.buildMimeMessage({
        from: gmailAddress,
        ...params,
      });

    const encodedMessage =
      this.encodeBase64Url(
        mimeMessage,
      );

    try {
      const response =
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });

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
   * Reply to an existing Gmail conversation.
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

    const gmail =
      google.gmail({
        version: 'v1',
        auth: client,
      });

    const headers = [
      `From: ${gmailAddress}`,
      `To: ${params.to}`,
      `Subject: ${this.encodeHeader(params.subject)}`,
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
            threadId:
              params.threadId,
          },
        });

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
   * Forward an existing email.
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

    const gmail =
      google.gmail({
        version: 'v1',
        auth: client,
      });

    const forwardBody =
      params.originalBody
        ? `${params.body}\n\n---------- Forwarded message ----------\n\n${params.originalBody}`
        : params.body;

    const headers = [
      `From: ${gmailAddress}`,
      `To: ${params.to}`,
      `Subject: ${this.encodeHeader(
        params.subject.startsWith('Fwd:')
          ? params.subject
          : `Fwd: ${params.subject}`,
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

    const gmail =
      google.gmail({
        version: 'v1',
        auth: client,
      });

    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  /**
   * Build a MIME message.
   */
  private buildMimeMessage(params: {
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
  }): string {
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

  private encodeHeader(
    value: string,
  ): string {
    return `=?UTF-8?B?${Buffer.from(
      value,
    ).toString('base64')}?=`;
  }

  private encodeBase64Url(
    value: string,
  ): string {
    return Buffer.from(value)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

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
        <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          ${escaped}
        </body>
      </html>
    `;
  }

  private handleGmailError(
    error: any,
    employeeId: string,
  ): never {
    this.logger.error(
      `Gmail API operation failed for employee ${employeeId}: ${error?.message}`,
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

    throw new Error(
      `Gmail API operation failed: ${error?.message || 'Unknown error'}`,
    );
  }
}