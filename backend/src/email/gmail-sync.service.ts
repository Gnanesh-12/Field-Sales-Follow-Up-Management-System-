import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { google } from 'googleapis';

import { PrismaService } from '../prisma/prisma.service';
import { GmailOAuthService } from './gmail-oauth.service';

interface ParsedGmailMessage {
  gmailMessageId: string;
  gmailThreadId: string;

  direction:
    | 'INBOUND'
    | 'OUTBOUND';

  fromEmail: string;

  toEmails: string[];

  ccEmails: string[];

  subject?: string;

  bodyText?: string;

  bodyHtml?: string;

  snippet?: string;

  messageId?: string;

  inReplyTo?: string;

  references?: string;

  isRead: boolean;

  sentAt: Date;
}

@Injectable()
export class GmailSyncService {
  private readonly logger =
    new Logger(
      GmailSyncService.name,
    );

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailOAuthService: GmailOAuthService,
  ) {}

  async syncEmployee(
    employeeId: string,
  ) {
    return this.syncEmployeeInbox(
      employeeId,
    );
  }

  async syncEmployeeInbox(
    employeeId: string,
  ) {
    const employee =
      await this.prisma.employee.findUnique(
        {
          where: {
            id:
              employeeId,
          },
        },
      );

    if (!employee) {
      throw new NotFoundException(
        'Employee not found.',
      );
    }

    const connection =
      await this.prisma.gmailConnection.findUnique(
        {
          where: {
            employeeId,
          },
        },
      );

    if (
      !connection ||
      !connection.isActive
    ) {
      throw new NotFoundException(
        'Gmail is not connected for this employee.',
      );
    }

    const {
      client,
      gmailAddress,
    } =
      await this.gmailOAuthService.getAuthenticatedClient(
        employeeId,
      );

    const gmail =
      google.gmail({
        version:
          'v1',

        auth:
          client,
      });

    let processed = 0;

    /*
     * Initial sync.
     *
     * Gmail supports q filtering for messages.
     * The additional isKshetraMessage() check is intentional.
     */
    if (!connection.historyId) {
      const response =
        await gmail.users.messages.list(
          {
            userId:
              'me',

            maxResults:
              100,

            q:
              'newer_than:30d subject:KSHETRA',
          },
        );

      const messages =
        response.data.messages ||
        [];

      for (const message of messages) {
        if (!message.id) {
          continue;
        }

        try {
          const parsed =
            await this.getParsedMessage(
              gmail,
              message.id,
              gmailAddress,
            );

          if (!parsed) {
            continue;
          }

          if (
            !(await this.isKshetraMessage(
              employeeId,
              parsed,
            ))
          ) {
            continue;
          }

          await this.saveParsedMessage(
            employeeId,
            parsed,
          );

          processed++;
        } catch (error: any) {
          this.logger.warn(
            `Failed to process Gmail message ${message.id}: ${
              error?.message ||
              error
            }`,
          );
        }
      }

      const profile =
        await gmail.users.getProfile(
          {
            userId:
              'me',
          },
        );

      await this.prisma.gmailConnection.update(
        {
          where: {
            employeeId,
          },

          data: {
            historyId:
              profile.data.historyId ||
              undefined,

            lastSyncedAt:
              new Date(),
          },
        },
      );

      return {
        success:
          true,

        mode:
          'initial',

        processed,

        gmailAddress,
      };
    }

    /*
     * Incremental sync.
     */
    try {
      let pageToken:
        | string
        | undefined;

      let newestHistoryId =
        connection.historyId;

      do {
        const response =
          await gmail.users.history.list(
            {
              userId:
                'me',

              startHistoryId:
                connection.historyId,

              historyTypes: [
                'messageAdded',
                'messageDeleted',
                'labelAdded',
                'labelRemoved',
              ],

              pageToken,
            },
          );

        const history =
          response.data.history ||
          [];

        for (const historyItem of history) {
          const addedMessages =
            historyItem.messagesAdded ||
            [];

          for (const added of addedMessages) {
            const messageId =
              added.message?.id;

            if (!messageId) {
              continue;
            }

            try {
              const parsed =
                await this.getParsedMessage(
                  gmail,
                  messageId,
                  gmailAddress,
                );

              if (!parsed) {
                continue;
              }

              /*
               * This check is asynchronous because a customer
               * reply may have changed the subject. If its Gmail
               * thread already belongs to a Kshetra conversation,
               * it is still allowed.
               */
              if (
                !(await this.isKshetraMessage(
                  employeeId,
                  parsed,
                ))
              ) {
                continue;
              }

              await this.saveParsedMessage(
                employeeId,
                parsed,
              );

              processed++;
            } catch (error: any) {
              this.logger.warn(
                `Failed to process incremental Gmail message ${messageId}: ${
                  error?.message ||
                  error
                }`,
              );
            }
          }

          if (historyItem.id) {
            newestHistoryId =
              historyItem.id;
          }
        }

        pageToken =
          response.data.nextPageToken ||
          undefined;

        if (
          response.data.historyId
        ) {
          newestHistoryId =
            response.data.historyId;
        }
      } while (pageToken);

      await this.prisma.gmailConnection.update(
        {
          where: {
            employeeId,
          },

          data: {
            historyId:
              newestHistoryId,

            lastSyncedAt:
              new Date(),
          },
        },
      );

      return {
        success:
          true,

        mode:
          'incremental',

        processed,

        gmailAddress,
      };
    } catch (error: any) {
      /*
       * Gmail history IDs expire.
       */
      if (
        error?.code === 404 ||
        error?.response?.status === 404
      ) {
        this.logger.warn(
          `Gmail history expired for employee ${employeeId}. Performing fresh sync.`,
        );

        await this.prisma.gmailConnection.update(
          {
            where: {
              employeeId,
            },

            data: {
              historyId:
                null,
            },
          },
        );

        return this.syncEmployeeInbox(
          employeeId,
        );
      }

      this.logger.error(
        `Gmail synchronization failed: ${
          error?.message ||
          error
        }`,
      );

      throw error;
    }
  }

  private async getParsedMessage(
    gmail: any,
    messageId: string,
    gmailAddress: string,
  ): Promise<
    ParsedGmailMessage | null
  > {
    const response =
      await gmail.users.messages.get(
        {
          userId:
            'me',

          id:
            messageId,

          format:
            'full',
        },
      );

    const message =
      response.data;

    if (
      !message?.id ||
      !message.threadId
    ) {
      return null;
    }

    const headers =
      message.payload?.headers ||
      [];

    const getHeader = (
      name: string,
    ): string | undefined => {
      const header =
        headers.find(
          (item: any) =>
            item.name?.toLowerCase() ===
            name.toLowerCase(),
        );

      return header?.value;
    };

    const fromEmail =
      this.extractEmail(
        getHeader(
          'From',
        ) || '',
      );

    const toEmails =
      this.splitEmails(
        getHeader(
          'To',
        ) || '',
      );

    const ccEmails =
      this.splitEmails(
        getHeader(
          'Cc',
        ) || '',
      );

    const body =
      this.extractBody(
        message.payload,
      );

    const labelIds =
      message.labelIds ||
      [];

    const isRead =
      !labelIds.includes(
        'UNREAD',
      );

    const internalDate =
      message.internalDate
        ? Number(
            message.internalDate,
          )
        : Date.now();

    const direction =
      fromEmail.toLowerCase() ===
      gmailAddress.toLowerCase()
        ? 'OUTBOUND'
        : 'INBOUND';

    return {
      gmailMessageId:
        message.id,

      gmailThreadId:
        message.threadId,

      direction,

      fromEmail,

      toEmails,

      ccEmails,

      subject:
        getHeader(
          'Subject',
        ),

      bodyText:
        body.text,

      bodyHtml:
        body.html,

      snippet:
        message.snippet ||
        '',

      messageId:
        getHeader(
          'Message-ID',
        ),

      inReplyTo:
        getHeader(
          'In-Reply-To',
        ),

      references:
        getHeader(
          'References',
        ),

      isRead,

      sentAt:
        new Date(
          internalDate,
        ),
    };
  }

  /**
   * A message belongs to Kshetra when:
   *
   * 1. Its subject explicitly contains [KSHETRA], OR
   * 2. Its Gmail thread already exists in Kshetra.
   *
   * The second condition is important for replies where Gmail/customer
   * software may alter the subject.
   */
  private async isKshetraMessage(
    employeeId: string,
    message: ParsedGmailMessage,
  ): Promise<boolean> {
    const subject =
      message.subject ||
      '';

    if (
      subject
        .toUpperCase()
        .includes(
          '[KSHETRA]',
        )
    ) {
      return true;
    }

    const existingThread =
      await this.prisma.emailThread.findFirst(
        {
          where: {
            employeeId,

            gmailThreadId:
              message.gmailThreadId,

            subject: {
              contains:
                '[KSHETRA]',

              mode:
                'insensitive',
            },
          },

          select: {
            id:
              true,
          },
        },
      );

    return !!existingThread;
  }

  private async saveParsedMessage(
    employeeId: string,
    message: ParsedGmailMessage,
  ) {
    /*
     * Always check duplicate messages first.
     *
     * Gmail history can contain multiple events for the same
     * message. We don't want those events to increment unreadCount.
     */
    const existingMessage =
      await this.prisma.emailMessage.findFirst(
        {
          where: {
            employeeId,

            gmailMessageId:
              message.gmailMessageId,
          },
        },
      );

    if (existingMessage) {
      await this.prisma.emailMessage.update(
        {
          where: {
            id:
              existingMessage.id,
          },

          data: {
            isRead:
              message.isRead,
          },
        },
      );

      return existingMessage;
    }

    let customerSiteId:
      | string
      | undefined;

    const customerEmail =
      this.findCustomerEmail(
        message,
      );

    if (customerEmail) {
      const site =
        await this.prisma.customerSite.findFirst(
          {
            where: {
              email: {
                equals:
                  customerEmail,

                mode:
                  'insensitive',
              },
            },

            select: {
              id:
                true,
            },
          },
        );

      customerSiteId =
        site?.id;
    }

    const participants =
      new Set<string>();

    if (message.fromEmail) {
      participants.add(
        message.fromEmail,
      );
    }

    for (const email of message.toEmails) {
      participants.add(
        email,
      );
    }

    for (const email of message.ccEmails) {
      participants.add(
        email,
      );
    }

    const existingThread =
      await this.prisma.emailThread.findFirst(
        {
          where: {
            employeeId,

            gmailThreadId:
              message.gmailThreadId,
          },
        },
      );

    let threadId: string;

    if (existingThread) {
      const existingParticipants =
        Array.isArray(
          existingThread.participants,
        )
          ? existingThread.participants
          : [];

      const mergedParticipants =
        new Set<string>(
          [
            ...existingParticipants,
            ...participants,
          ],
        );

      const newUnreadIncrement =
        message.direction ===
          'INBOUND' &&
        !message.isRead
          ? 1
          : 0;

      threadId =
        existingThread.id;

      await this.prisma.emailThread.update(
        {
          where: {
            id:
              existingThread.id,
          },

          data: {
            subject:
              this.preferKshetraSubject(
                message.subject,
                existingThread.subject,
              ),

            participants:
              Array.from(
                mergedParticipants,
              ),

            lastMessageAt:
              message.sentAt,

            ...(customerSiteId
              ? {
                  customerSiteId,
                }
              : {}),

            ...(newUnreadIncrement >
            0
              ? {
                  unreadCount:
                    {
                      increment:
                        newUnreadIncrement,
                    },
                }
              : {}),
          },
        },
      );
    } else {
      const created =
        await this.prisma.emailThread.create(
          {
            data: {
              employeeId,

              customerSiteId:
                customerSiteId ||
                null,

              gmailThreadId:
                message.gmailThreadId,

              subject:
                message.subject ||
                null,

              participants:
                Array.from(
                  participants,
                ),

              lastMessageAt:
                message.sentAt,

              unreadCount:
                message.direction ===
                  'INBOUND' &&
                !message.isRead
                  ? 1
                  : 0,
            },
          },
        );

      threadId =
        created.id;
    }

    return this.prisma.emailMessage.create(
      {
        data: {
          threadId,

          employeeId,

          gmailMessageId:
            message.gmailMessageId,

          gmailThreadId:
            message.gmailThreadId,

          direction:
            message.direction,

          fromEmail:
            message.fromEmail,

          toEmails:
            message.toEmails,

          ccEmails:
            message.ccEmails,

          subject:
            message.subject ||
            null,

          bodyText:
            message.bodyText ||
            null,

          bodyHtml:
            message.bodyHtml ||
            null,

          snippet:
            message.snippet ||
            null,

          messageId:
            message.messageId ||
            null,

          inReplyTo:
            message.inReplyTo ||
            null,

          references:
            message.references ||
            null,

          isRead:
            message.isRead,

          sentAt:
            message.sentAt,
        },
      },
    );
  }

  private preferKshetraSubject(
    incoming?: string,
    existing?: string | null,
  ): string | null {
    if (
      incoming?.trim()
    ) {
      return incoming;
    }

    return existing || null;
  }

  private findCustomerEmail(
    message: ParsedGmailMessage,
  ): string | undefined {
    if (
      message.direction ===
      'INBOUND'
    ) {
      return message.fromEmail;
    }

    return (
      message.toEmails[0] ||
      message.ccEmails[0]
    );
  }

  private extractEmail(
    value: string,
  ): string {
    const match =
      value.match(
        /<([^>]+)>/,
      );

    return (
      match?.[1] ||
      value.trim()
    );
  }

  private splitEmails(
    value: string,
  ): string[] {
    if (!value.trim()) {
      return [];
    }

    return value
      .split(',')
      .map(
        (item) =>
          this.extractEmail(
            item,
          ),
      )
      .map(
        (item) =>
          item.trim(),
      )
      .filter(Boolean);
  }

  private extractBody(
    payload: any,
  ): {
    text?: string;
    html?: string;
  } {
    if (!payload) {
      return {};
    }

    let text:
      | string
      | undefined;

    let html:
      | string
      | undefined;

    const decode = (
      data?: string,
    ): string | undefined => {
      if (!data) {
        return undefined;
      }

      try {
        return Buffer.from(
          data
            .replace(
              /-/g,
              '+',
            )
            .replace(
              /_/g,
              '/',
            ),
          'base64',
        ).toString(
          'utf8',
        );
      } catch {
        return undefined;
      }
    };

    if (
      payload.mimeType ===
        'text/plain' &&
      payload.body?.data
    ) {
      text =
        decode(
          payload.body.data,
        );
    }

    if (
      payload.mimeType ===
        'text/html' &&
      payload.body?.data
    ) {
      html =
        decode(
          payload.body.data,
        );
    }

    for (
      const part of
        payload.parts || []
    ) {
      const child =
        this.extractBody(
          part,
        );

      text =
        text ||
        child.text;

      html =
        html ||
        child.html;
    }

    return {
      text,
      html,
    };
  }
}