import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Mailpit Service — captures emails locally during development/testing.
 * 
 * When EMAIL_PROVIDER=mailpit (or in development mode), emails are routed
 * to the local Mailpit SMTP server instead of Gmail API.
 * 
 * Mailpit Web UI: http://localhost:8025
 * Mailpit SMTP:   localhost:1025
 */
@Injectable()
export class MailpitService {
  private readonly logger = new Logger(MailpitService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const mailpitHost = this.configService.get<string>('MAILPIT_HOST') || 'localhost';
    const mailpitPort = parseInt(this.configService.get<string>('MAILPIT_PORT') || '1025', 10);

    try {
      this.transporter = nodemailer.createTransport({
        host: mailpitHost,
        port: mailpitPort,
        secure: false,        // Mailpit does not use TLS
        ignoreTLS: true,
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.logger.log(`Mailpit transport configured: ${mailpitHost}:${mailpitPort}`);
    } catch (error) {
      this.logger.warn(`Mailpit transport not available: ${error.message}`);
    }
  }

  /**
   * Send an email through Mailpit for local testing.
   * Returns a mock message ID.
   */
  async sendEmail(params: {
    from: string;
    to: string;
    cc?: string[];
    subject: string;
    body: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }): Promise<{ messageId: string }> {
    if (!this.transporter) {
      throw new Error('Mailpit is not configured or not running. Start Mailpit and restart the server.');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: params.from,
      to: params.to,
      cc: params.cc?.join(', '),
      subject: params.subject,
      html: this.textToHtml(params.body),
      attachments: params.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to Mailpit: ${info.messageId}`);
      return { messageId: info.messageId || `mailpit-${Date.now()}` };
    } catch (error) {
      this.logger.error(`Mailpit send failed: ${error.message}`);
      throw new Error(`Failed to send email via Mailpit: ${error.message}. Is Mailpit running?`);
    }
  }

  /**
   * Check if Mailpit is available.
   */
  async isAvailable(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  private textToHtml(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">${escaped}</body></html>`;
  }
}
