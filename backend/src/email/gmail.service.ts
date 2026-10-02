import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { GmailOAuthService } from './gmail-oauth.service';

/**
 * Gmail Service — handles sending emails via the Gmail API.
 * 
 * This service is responsible ONLY for the Gmail API interaction.
 * Business logic (validation, logging, etc.) lives in EmailService.
 * 
 * Phase 1: Send-only. No inbox read/sync.
 */
@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(private readonly gmailOAuthService: GmailOAuthService) {}

  /**
   * Send an email through the employee's connected Gmail account using the Gmail API.
   * 
   * Returns the Gmail message ID on success.
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
  ): Promise<{ messageId: string; threadId: string }> {
    const { client, gmailAddress } = await this.gmailOAuthService.getAuthenticatedClient(employeeId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    // Build the MIME message
    const mimeMessage = this.buildMimeMessage({
      from: gmailAddress,
      ...params,
    });

    // Encode in base64url format for Gmail API
    const encodedMessage = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      this.logger.log(`Email sent via Gmail API for employee ${employeeId}, messageId: ${response.data.id}`);

      return {
        messageId: response.data.id || '',
        threadId: response.data.threadId || '',
      };
    } catch (error) {
      this.logger.error(`Gmail API send failed for employee ${employeeId}: ${error.message}`);

      // Provide user-friendly error messages
      if (error.code === 401 || error.code === 403) {
        throw new Error('Gmail authorization has expired or been revoked. Please reconnect your Gmail account.');
      }
      if (error.code === 429) {
        throw new Error('Gmail sending rate limit reached. Please try again in a few minutes.');
      }
      if (error.message?.includes('invalid_grant')) {
        throw new Error('Gmail authorization has been revoked. Please reconnect your Gmail account.');
      }

      throw new Error(`Failed to send email via Gmail: ${error.message}`);
    }
  }

  /**
   * Build a MIME-formatted email message string.
   * Supports plain text body, CC, and file attachments.
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
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hasAttachments = params.attachments && params.attachments.length > 0;

    let headers = [
      `From: ${params.from}`,
      `To: ${params.to}`,
      ...(params.cc?.length ? [`Cc: ${params.cc.join(', ')}`] : []),
      `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
    ];

    if (hasAttachments) {
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

      const parts: string[] = [];

      // Text body part
      parts.push([
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(this.textToHtml(params.body)).toString('base64'),
      ].join('\r\n'));

      // Attachment parts
      for (const attachment of params.attachments!) {
        parts.push([
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          '',
          attachment.content.toString('base64'),
        ].join('\r\n'));
      }

      parts.push(`--${boundary}--`);

      return headers.join('\r\n') + '\r\n\r\n' + parts.join('\r\n');
    } else {
      headers.push('Content-Type: text/html; charset="UTF-8"');
      headers.push('Content-Transfer-Encoding: base64');

      return headers.join('\r\n') + '\r\n\r\n' + Buffer.from(this.textToHtml(params.body)).toString('base64');
    }
  }

  /**
   * Convert plain text to basic HTML, preserving line breaks.
   */
  private textToHtml(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">${escaped}</body></html>`;
  }
}
