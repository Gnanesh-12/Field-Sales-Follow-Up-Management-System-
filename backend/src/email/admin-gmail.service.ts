import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { google } from 'googleapis';

import { GmailOAuthService } from './gmail-oauth.service';

@Injectable()
export class AdminGmailService {
  private readonly logger = new Logger(AdminGmailService.name);

  static readonly KSHETRA_MARKER = '[KSHETRA]';

  constructor(
    private readonly gmailOAuthService: GmailOAuthService,
  ) {}

  /**
   * Get Kshetra-related inbox messages for the admin Gmail account.
   *
   * This intentionally filters Gmail using the [KSHETRA] subject marker
   * so unrelated personal/work Gmail messages are not shown in Kshetra.
   */
  async getInbox(
    adminId: string,
    employeeEmail?: string,
    page = 1,
    limit = 30,
  ) {
    const { client, gmailAddress } =
      await this.gmailOAuthService.getAdminAuthenticatedClient(adminId);

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    const queries: string[] = [
      `subject:"${AdminGmailService.KSHETRA_MARKER}"`,
    ];

    if (employeeEmail?.trim()) {
      const email = employeeEmail.trim();

      queries.push(`{from:${email} to:${email} cc:${email}}`);
    }

    const q = queries.join(' ');

    const response = await gmail.users.threads.list({
      userId: 'me',
      q,
      maxResults: Math.min(Math.max(limit, 1), 100),
    });

    const threads = response.data.threads ?? [];

    const start = Math.max(page - 1, 0) * limit;
    const selectedThreads = threads.slice(start, start + limit);

    const result: any[] = [];

    for (const thread of selectedThreads) {
      if (!thread.id) {
        continue;
      }

      try {
        const threadResponse = await gmail.users.threads.get({
          userId: 'me',
          id: thread.id,
          format: 'full',
        });

        const messages = threadResponse.data.messages ?? [];

        const parsedMessages = messages.map((message) => {
          const headers =
            message.payload?.headers ?? [];

          const getHeader = (name: string) =>
            headers.find(
              (header) =>
                header.name?.toLowerCase() ===
                name.toLowerCase(),
            )?.value ?? '';

          return {
            id: message.id,
            threadId: message.threadId,
            labelIds: message.labelIds ?? [],
            snippet: message.snippet ?? '',
            internalDate: message.internalDate
              ? new Date(
                  Number(message.internalDate),
                )
              : null,
            from: getHeader('From'),
            to: getHeader('To'),
            cc: getHeader('Cc'),
            subject: getHeader('Subject'),
            messageId: getHeader('Message-ID'),
            inReplyTo: getHeader('In-Reply-To'),
            references: getHeader('References'),
          };
        });

        const lastMessage =
          parsedMessages[parsedMessages.length - 1];

        const unreadCount = parsedMessages.filter(
          (message) =>
            message.labelIds.includes('UNREAD'),
        ).length;

        result.push({
          id: thread.id,
          gmailThreadId: thread.id,
          subject:
            lastMessage?.subject ??
            `${AdminGmailService.KSHETRA_MARKER} Email`,
          snippet:
            lastMessage?.snippet ?? '',
          lastMessageAt:
            lastMessage?.internalDate ?? null,
          unreadCount,
          messages: parsedMessages,
          gmailAddress,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to load Gmail thread ${thread.id}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        );
      }
    }

    return {
      page,
      limit,
      total: response.data.resultSizeEstimate ?? threads.length,
      threads: result,
    };
  }

  /**
   * Get one complete Gmail thread.
   */
  async getThread(
    adminId: string,
    threadId: string,
  ) {
    const { client } =
      await this.gmailOAuthService.getAdminAuthenticatedClient(
        adminId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    try {
      const response =
        await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'full',
        });

      return response.data;
    } catch (error) {
      this.handleGmailError(
        error,
        'Unable to fetch Gmail thread',
      );
    }
  }

  /**
   * Reply to an existing Kshetra Gmail thread.
   */
  async reply(
    adminId: string,
    threadId: string,
    to: string,
    subject: string,
    body: string,
  ) {
    const { client, gmailAddress } =
      await this.gmailOAuthService.getAdminAuthenticatedClient(
        adminId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    const threadResponse =
      await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

    const messages =
      threadResponse.data.messages ?? [];

    if (!messages.length) {
      throw new NotFoundException(
        'Gmail thread has no messages',
      );
    }

    const lastMessage =
      messages[messages.length - 1];

    const headers =
      lastMessage.payload?.headers ?? [];

    const getHeader = (name: string) =>
      headers.find(
        (header) =>
          header.name?.toLowerCase() ===
          name.toLowerCase(),
      )?.value ?? '';

    const originalMessageId =
      getHeader('Message-ID');

    const references =
      getHeader('References');

    const finalSubject =
      this.ensureKshetraSubject(
        subject ||
          getHeader('Subject') ||
          'Kshetra Email',
      );

    const mimeHeaders = [
      `From: ${this.encodeHeader(gmailAddress)}`,
      `To: ${this.encodeHeader(to)}`,
      `Subject: ${this.encodeHeader(finalSubject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
    ];

    if (originalMessageId) {
      mimeHeaders.push(
        `In-Reply-To: ${originalMessageId}`,
      );
    }

    if (references) {
      mimeHeaders.push(
        `References: ${references}${
          originalMessageId
            ? ` ${originalMessageId}`
            : ''
        }`,
      );
    } else if (originalMessageId) {
      mimeHeaders.push(
        `References: ${originalMessageId}`,
      );
    }

    const raw = this.encodeBase64Url(
      `${mimeHeaders.join(
        '\r\n',
      )}\r\n\r\n${this.textToHtml(body)}`,
    );

    try {
      const response =
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw,
            threadId,
          },
        });

      return {
        success: true,
        messageId:
          response.data.id ?? null,
        threadId:
          response.data.threadId ??
          threadId,
      };
    } catch (error) {
      this.handleGmailError(
        error,
        'Unable to send admin Gmail reply',
      );
    }
  }

  /**
   * Mark a Gmail message as read.
   */
  async markRead(
    adminId: string,
    messageId: string,
  ) {
    const { client } =
      await this.gmailOAuthService.getAdminAuthenticatedClient(
        adminId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    try {
      const response =
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });

      return {
        success: true,
        messageId: response.data.id ?? messageId,
      };
    } catch (error) {
      this.handleGmailError(
        error,
        'Unable to mark Gmail message as read',
      );
    }
  }

  /**
   * Get a single Gmail message.
   */
  async getMessage(
    adminId: string,
    messageId: string,
  ) {
    const { client } =
      await this.gmailOAuthService.getAdminAuthenticatedClient(
        adminId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    try {
      const response =
        await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

      return response.data;
    } catch (error) {
      this.handleGmailError(
        error,
        'Unable to fetch Gmail message',
      );
    }
  }

  /**
   * Send a new Kshetra email from the admin Gmail account.
   */
  async sendEmail(
    adminId: string,
    params: {
      to: string;
      cc?: string;
      subject: string;
      body: string;
    },
  ) {
    const { client, gmailAddress } =
      await this.gmailOAuthService.getAdminAuthenticatedClient(
        adminId,
      );

    const gmail = google.gmail({
      version: 'v1',
      auth: client,
    });

    const subject =
      this.ensureKshetraSubject(params.subject);

    const headers = [
      `From: ${this.encodeHeader(gmailAddress)}`,
      `To: ${this.encodeHeader(params.to)}`,
    ];

    if (params.cc?.trim()) {
      headers.push(
        `Cc: ${this.encodeHeader(params.cc)}`,
      );
    }

    headers.push(
      `Subject: ${this.encodeHeader(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
    );

    const raw = this.encodeBase64Url(
      `${headers.join(
        '\r\n',
      )}\r\n\r\n${this.textToHtml(params.body)}`,
    );

    try {
      const response =
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw,
          },
        });

      return {
        success: true,
        messageId:
          response.data.id ?? null,
        threadId:
          response.data.threadId ?? null,
      };
    } catch (error) {
      this.handleGmailError(
        error,
        'Unable to send admin Gmail message',
      );
    }
  }

  /**
   * Backwards-compatible aliases.
   */
  async listKshetraThreads(
    adminId: string,
    employeeEmail?: string,
  ) {
    return this.getInbox(
      adminId,
      employeeEmail,
      1,
      100,
    );
  }

  async markMessageRead(
    adminId: string,
    messageId: string,
  ) {
    return this.markRead(adminId, messageId);
  }

  private isKshetraSubject(
    subject?: string | null,
  ) {
    return (
      !!subject &&
      subject
        .toLowerCase()
        .includes(
          AdminGmailService.KSHETRA_MARKER.toLowerCase(),
        )
    );
  }

  private ensureKshetraSubject(
    subject?: string | null,
  ) {
    const cleanSubject =
      subject?.trim() || 'Kshetra Email';

    if (this.isKshetraSubject(cleanSubject)) {
      return cleanSubject;
    }

    return `${AdminGmailService.KSHETRA_MARKER} ${cleanSubject}`;
  }

  private encodeHeader(value: string) {
    if (/^[\x00-\x7F]*$/.test(value)) {
      return value;
    }

    return `=?UTF-8?B?${Buffer.from(value).toString(
      'base64',
    )}?=`;
  }

  private encodeBase64Url(value: string) {
    return Buffer.from(value)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private textToHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r?\n/g, '<br>');
  }

  private handleGmailError(
    error: unknown,
    fallbackMessage: string,
  ): never {
    this.logger.error(
      `${fallbackMessage}: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );

    throw error;
  }
}