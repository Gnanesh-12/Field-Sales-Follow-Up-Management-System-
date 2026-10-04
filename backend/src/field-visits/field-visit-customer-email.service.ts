import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class FieldVisitCustomerEmailService {
  private readonly logger =
    new Logger(FieldVisitCustomerEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async sendCustomerCopy(
    employeeId: string,
    fieldVisitId: string,
    customerEmail: string,
  ) {
    if (!this.isValidEmail(customerEmail)) {
      throw new BadRequestException(
        'Invalid customer email address.',
      );
    }

    const visit =
      await this.prisma.fieldVisit.findFirst({
        where: {
          id: fieldVisitId,
          employeeId,
        },
        include: {
          site: true,
          location: true,
          attachments: true,
          materials: {
            include: {
              material: true,
            },
          },
          followUps: true,
          employee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!visit) {
      throw new BadRequestException(
        'Field visit was created, but the visit could not be loaded for customer email.',
      );
    }

    const subject =
      `[KSHETRA] Field Visit Report - ${
        visit.site?.name || 'Customer Site'
      } - ${new Date(
        visit.timestamp,
      ).toLocaleDateString('en-IN')}`;

    const body =
      this.buildCustomerEmailBody(visit);

    const attachmentUrls =
      visit.attachments
        .map((attachment) => attachment.fileUrl)
        .filter(Boolean);

    const result =
      await this.emailService.sendEmail(
        employeeId,
        {
          to: customerEmail.trim(),
          subject,
          body,
          customerSiteId:
            visit.customerSiteId,
          attachmentUrls,
        },
      );

    /*
     * Keep the existing EmailLog as the source of
     * send status. We additionally associate this
     * email with the field visit.
     */
    if (result.id) {
      try {
        await this.prisma.emailLog.update({
          where: {
            id: result.id,
          },
          data: {
            fieldVisitId: visit.id,
            isVisitReport: true,
          },
        });
      } catch (error) {
        /*
         * Do not fail the customer email because
         * audit association failed.
         */
        this.logger.warn(
          `Customer email sent but EmailLog association failed for visit ${visit.id}: ${
            error?.message || error
          }`,
        );
      }
    }

    return {
      success: true,
      status: result.status,
      emailLogId: result.id,
      gmailMessageId:
        result.gmailMessageId,
      recipientEmail:
        customerEmail.trim(),
    };
  }

  private buildCustomerEmailBody(
    visit: any,
  ): string {
    const lines: string[] = [];

    lines.push(
      `Hello ${visit.site?.name || 'Customer'},`,
    );

    lines.push('');

    lines.push(
      'Please find below the field visit details recorded by our sales representative.',
    );

    lines.push('');

    lines.push('FIELD VISIT DETAILS');
    lines.push(
      '----------------------------------------',
    );

    lines.push(
      `Visit ID: ${visit.id}`,
    );

    lines.push(
      `Employee: ${
        visit.employee?.name ||
        visit.employeeId
      }`,
    );

    lines.push(
      `Visit Date: ${new Date(
        visit.timestamp,
      ).toLocaleString('en-IN')}`,
    );

    lines.push(
      `Customer/Site: ${
        visit.site?.name ||
        'N/A'
      }`,
    );

    if (visit.site?.address) {
      lines.push(
        `Address: ${visit.site.address}`,
      );
    }

    if (visit.location) {
      lines.push('');

      lines.push('VISIT LOCATION');

      lines.push(
        `Latitude: ${visit.location.lat}`,
      );

      lines.push(
        `Longitude: ${visit.location.lng}`,
      );

      if (
        visit.location.accuracy != null
      ) {
        lines.push(
          `Accuracy: ${visit.location.accuracy} m`,
        );
      }
    }

    if (
      visit.notes ||
      visit.remarks
    ) {
      lines.push('');

      lines.push('VISIT NOTES');

      if (visit.notes) {
        lines.push(
          visit.notes,
        );
      }

      if (visit.remarks) {
        lines.push(
          `Remarks: ${visit.remarks}`,
        );
      }
    }

    if (
      visit.materials &&
      visit.materials.length > 0
    ) {
      lines.push('');

      lines.push('MATERIALS');

      for (
        const material of
          visit.materials
      ) {
        lines.push(
          `- ${
            material.material?.name ||
            'Material'
          }: ${
            material.quantity
          } ${
            material.material?.unit ||
            ''
          }`,
        );
      }
    }

    if (
      visit.followUps &&
      visit.followUps.length > 0
    ) {
      lines.push('');

      lines.push('FOLLOW-UP');

      for (
        const followUp of
          visit.followUps
      ) {
        lines.push(
          `- Due date: ${new Date(
            followUp.dueDate,
          ).toLocaleDateString(
            'en-IN',
          )}`,
        );

        if (followUp.notes) {
          lines.push(
            `  Task: ${followUp.notes}`,
          );
        }
      }
    }

    lines.push('');

    lines.push(
      'The field visit photos, if any, are attached to this email.',
    );

    lines.push('');

    lines.push(
      'If you have any questions or would like to respond regarding this visit, simply reply to this email.',
    );

    lines.push('');

    lines.push(
      'Regards,',
    );

    lines.push(
      visit.employee?.name ||
        'Kshetra Field Sales Team',
    );

    lines.push('');

    lines.push(
      'Sent via Kshetra Field Sales Management System',
    );

    return lines.join('\n');
  }

  private isValidEmail(
    email: string,
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    );
  }
}