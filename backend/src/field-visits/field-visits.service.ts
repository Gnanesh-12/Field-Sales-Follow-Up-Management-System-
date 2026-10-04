// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class FieldVisitsService {
//   constructor(private prisma: PrismaService) { }

//   async createVisit(employeeId: string, data: {
//     id?: string;
//     customerSiteName: string;
//     notes?: string;
//     remarks?: string;
//     lat?: number;
//     lng?: number;
//     accuracy?: number;
//     imageUrls?: string[];
//     materials?: { materialName: string; unit?: string; quantity: number }[];
//     followUp?: { notes: string; dueDate: string };
//   }) {
//     // Find or create CustomerSite by name
//     let site = await this.prisma.customerSite.findFirst({
//       where: { name: data.customerSiteName },
//     });
//     if (!site) {
//       site = await this.prisma.customerSite.create({
//         data: { name: data.customerSiteName, address: '' },
//       });
//     }

//     // Resolve material IDs (find or create each material by name)
//     let materialEntries: { materialId: string; quantity: number }[] = [];
//     if (data.materials?.length) {
//       for (const m of data.materials) {
//         let material = await this.prisma.material.findFirst({
//           where: { name: m.materialName },
//         });
//         if (!material) {
//           material = await this.prisma.material.create({
//             data: { name: m.materialName, unit: m.unit || 'units' },
//           });
//         }
//         materialEntries.push({ materialId: material.id, quantity: m.quantity });
//       }
//     }

//     try {
//       return await this.prisma.fieldVisit.create({
//         data: {
//           id: data.id,
//           employeeId,
//           customerSiteId: site.id,
//           notes: data.notes,
//           remarks: data.remarks,
//           location: (data.lat != null && data.lng != null) ? {
//             create: {
//               lat: data.lat,
//               lng: data.lng,
//               accuracy: data.accuracy,
//             }
//           } : undefined,
//           attachments: data.imageUrls?.length ? {
//             create: data.imageUrls.map((url) => ({
//               fileUrl: url,
//               type: 'image',
//             })),
//           } : undefined,
//           materials: materialEntries.length > 0 ? {
//             create: materialEntries.map(m => ({
//               materialId: m.materialId,
//               quantity: m.quantity,
//             }))
//           } : undefined,
//           followUps: data.followUp ? {
//             create: {
//               notes: data.followUp.notes,
//               dueDate: new Date(data.followUp.dueDate),
//             }
//           } : undefined,
//         },
//         include: {
//           site: true,
//           location: true,
//           attachments: true,
//           materials: { include: { material: true } },
//           followUps: true,
//         },
//       });
//     } catch (error) {
//       if (error.code === 'P2002' && data.id) {
//         // Idempotency: if the visit was already created with this ID, just return it.
//         return this.prisma.fieldVisit.findUnique({
//           where: { id: data.id },
//           include: {
//             site: true,
//             location: true,
//             attachments: true,
//             materials: { include: { material: true } },
//             followUps: true,
//           },
//         });
//       }
//       throw error;
//     }
//   }

//   async listVisits(employeeId: string, page = 1, limit = 20) {
//     const skip = (page - 1) * limit;
//     const [visits, total] = await Promise.all([
//       this.prisma.fieldVisit.findMany({
//         where: { employeeId },
//         skip,
//         take: limit,
//         orderBy: { timestamp: 'desc' },
//         include: {
//           site: true,
//           location: true,
//           attachments: true,
//           materials: { include: { material: true } },
//           followUps: true,
//         },
//       }),
//       this.prisma.fieldVisit.count({ where: { employeeId } }),
//     ]);

//     return { visits, total, page, limit };
//   }

//   async getVisit(employeeId: string, visitId: string) {
//     return this.prisma.fieldVisit.findFirst({
//       where: { id: visitId, employeeId },
//       include: {
//         site: true,
//         location: true,
//         attachments: true,
//         materials: { include: { material: true } },
//         followUps: true,
//       },
//     });
//   }

//   async deleteVisit(employeeId: string, visitId: string) {
//     const visit = await this.prisma.fieldVisit.findFirst({
//       where: { id: visitId, employeeId },
//     });

//     if (!visit) {
//       return { count: 0 };
//     }

//     await this.prisma.$transaction([
//       this.prisma.followUp.deleteMany({ where: { fieldVisitId: visitId } }),
//       this.prisma.location.deleteMany({ where: { fieldVisitId: visitId } }),
//       this.prisma.attachment.deleteMany({ where: { fieldVisitId: visitId } }),
//       this.prisma.materialSupply.deleteMany({ where: { fieldVisitId: visitId } }),
//       this.prisma.fieldVisit.delete({ where: { id: visitId } }),
//     ]);

//     return { count: 1 };
//   }
// }

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  GmailService,
} from '../email/gmail.service';

@Injectable()
export class FieldVisitsService {
  private readonly logger =
    new Logger(
      FieldVisitsService.name,
    );

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailService: GmailService,
  ) {}

  // ============================================================
  // CREATE VISIT
  // ============================================================

  async createVisit(
    employeeId: string,
    data: {
      id?: string;
      customerSiteName: string;
      notes?: string;
      remarks?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
      imageUrls?: string[];
      materials?: {
        materialName: string;
        unit?: string;
        quantity: number;
      }[];
      followUp?: {
        notes: string;
        dueDate: string;
      };
    },
  ) {
    let site =
      await this.prisma.customerSite.findFirst(
        {
          where: {
            name:
              data.customerSiteName,
          },
        },
      );

    if (!site) {
      site =
        await this.prisma.customerSite.create(
          {
            data: {
              name:
                data.customerSiteName,
              address: '',
            },
          },
        );
    }

    const materialEntries: {
      materialId: string;
      quantity: number;
    }[] = [];

    if (data.materials?.length) {
      for (
        const materialInput of
          data.materials
      ) {
        let material =
          await this.prisma.material.findFirst(
            {
              where: {
                name:
                  materialInput.materialName,
              },
            },
          );

        if (!material) {
          material =
            await this.prisma.material.create(
              {
                data: {
                  name:
                    materialInput.materialName,
                  unit:
                    materialInput.unit ||
                    'units',
                },
              },
            );
        }

        materialEntries.push({
          materialId:
            material.id,
          quantity:
            materialInput.quantity,
        });
      }
    }

    try {
      const visit =
        await this.prisma.fieldVisit.create(
          {
            data: {
              id: data.id,
              employeeId,
              customerSiteId:
                site.id,
              notes:
                data.notes,
              remarks:
                data.remarks,

              location:
                data.lat != null &&
                data.lng != null
                  ? {
                      create: {
                        lat:
                          data.lat,
                        lng:
                          data.lng,
                        accuracy:
                          data.accuracy,
                      },
                    }
                  : undefined,

              attachments:
                data.imageUrls?.length
                  ? {
                      create:
                        data.imageUrls.map(
                          (url) => ({
                            fileUrl:
                              url,
                            type:
                              'image',
                          }),
                        ),
                    }
                  : undefined,

              materials:
                materialEntries.length
                  ? {
                      create:
                        materialEntries.map(
                          (material) => ({
                            materialId:
                              material.materialId,
                            quantity:
                              material.quantity,
                          }),
                        ),
                    }
                  : undefined,

              followUps:
                data.followUp
                  ? {
                      create: {
                        notes:
                          data.followUp
                            .notes,
                        dueDate:
                          new Date(
                            data.followUp
                              .dueDate,
                          ),
                      },
                    }
                  : undefined,
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
              employee: true,
            },
          },
        );

      // --------------------------------------------------------
      // AUTOMATIC ADMIN EMAIL
      // --------------------------------------------------------

      void this.sendVisitToAdmin(
        visit,
      );

      return visit;
    } catch (error) {
      if (
        error?.code ===
          'P2002' &&
        data.id
      ) {
        return this.prisma.fieldVisit.findUnique(
          {
            where: {
              id: data.id,
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
            },
          },
        );
      }

      throw error;
    }
  }

  // ============================================================
  // AUTOMATIC ENTRY EMAIL
  // ============================================================

  private async sendVisitToAdmin(
    visit: any,
  ): Promise<void> {
    try {
      const adminConnection =
        await this.prisma.adminGmailConnection.findFirst(
          {
            where: {
              isActive: true,
            },
            orderBy: {
              connectedAt: 'asc',
            },
            select: {
              gmailAddress: true,
            },
          },
        );

      if (!adminConnection) {
        this.logger.warn(
          'No active admin Gmail connection. Field entry email skipped.',
        );

        return;
      }

      const employee =
        visit.employee;

      const subject =
        `[KSHETRA] Field Entry #${visit.id} - ${
          visit.site?.name ||
          'Customer Visit'
        }`;

      const body =
        this.buildVisitEmailBody(
          visit,
          employee,
        );

      await this.gmailService.sendEmail(
        visit.employeeId,
        {
          to:
            adminConnection.gmailAddress,
          subject,
          body,
        },
      );

      this.logger.log(
        `Field entry ${visit.id} automatically emailed to admin.`,
      );
    } catch (error) {
      this.logger.error(
        `Automatic field-entry email failed for ${visit.id}: ${
          error?.message || error
        }`,
      );
    }
  }

  // ============================================================
  // EMPLOYEE -> ADMIN MESSAGE
  // ============================================================

  async sendMessageToAdmin(
    employeeId: string,
    visitId: string,
    message: string,
  ) {
    if (!message?.trim()) {
      throw new Error(
        'Message is required.',
      );
    }

    const visit =
      await this.prisma.fieldVisit.findFirst(
        {
          where: {
            id: visitId,
            employeeId,
          },
          include: {
            site: true,
            employee: true,
            followUps: true,
          },
        },
      );

    if (!visit) {
      throw new Error(
        'Field visit not found.',
      );
    }

    const adminConnection =
      await this.prisma.adminGmailConnection.findFirst(
        {
          where: {
            isActive: true,
          },
          orderBy: {
            connectedAt: 'asc',
          },
          select: {
            gmailAddress: true,
          },
        },
      );

    if (!adminConnection) {
      throw new Error(
        'Admin Gmail is not connected. Please ask the administrator to connect Gmail first.',
      );
    }

    const subject =
      `[KSHETRA] Field Entry #${visit.id} - ${
        visit.site?.name ||
        'Customer Visit'
      }`;

    const body = [
      'MESSAGE FROM FIELD EMPLOYEE',
      '',
      `Field Entry ID: ${visit.id}`,
      `Employee: ${
        visit.employee?.name ||
        employeeId
      }`,
      `Employee ID: ${employeeId}`,
      `Customer/Site: ${
        visit.site?.name ||
        'Unknown'
      }`,
      `Visit Date: ${
        new Date(
          visit.timestamp,
        ).toLocaleString()
      }`,
      '',
      'Message:',
      message.trim(),
      '',
      'Sent via Kshetra Field Sales Management System',
    ].join('\n');

    const result =
      await this.gmailService.sendEmail(
        employeeId,
        {
          to:
            adminConnection.gmailAddress,
          subject,
          body,
        },
      );

    return {
      success: true,
      ...result,
    };
  }

  // ============================================================
  // VISIT LIST
  // ============================================================

  async listVisits(
    employeeId: string,
    page = 1,
    limit = 20,
  ) {
    const skip =
      (page - 1) * limit;

    const [
      visits,
      total,
    ] =
      await Promise.all([
        this.prisma.fieldVisit.findMany(
          {
            where: {
              employeeId,
            },
            skip,
            take: limit,
            orderBy: {
              timestamp:
                'desc',
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
            },
          },
        ),

        this.prisma.fieldVisit.count(
          {
            where: {
              employeeId,
            },
          },
        ),
      ]);

    return {
      visits,
      total,
      page,
      limit,
    };
  }

  // ============================================================
  // VISIT DETAIL
  // ============================================================

  async getVisit(
    employeeId: string,
    visitId: string,
  ) {
    return this.prisma.fieldVisit.findFirst(
      {
        where: {
          id: visitId,
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
        },
      },
    );
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteVisit(
    employeeId: string,
    visitId: string,
  ) {
    const visit =
      await this.prisma.fieldVisit.findFirst(
        {
          where: {
            id: visitId,
            employeeId,
          },
        },
      );

    if (!visit) {
      return {
        count: 0,
      };
    }

    await this.prisma.$transaction([
      this.prisma.followUp.deleteMany(
        {
          where: {
            fieldVisitId:
              visitId,
          },
        },
      ),

      this.prisma.location.deleteMany(
        {
          where: {
            fieldVisitId:
              visitId,
          },
        },
      ),

      this.prisma.attachment.deleteMany(
        {
          where: {
            fieldVisitId:
              visitId,
          },
        },
      ),

      this.prisma.materialSupply.deleteMany(
        {
          where: {
            fieldVisitId:
              visitId,
          },
        },
      ),

      this.prisma.fieldVisit.delete(
        {
          where: {
            id: visitId,
          },
        },
      ),
    ]);

    return {
      count: 1,
    };
  }

  // ============================================================
  // EMAIL BODY
  // ============================================================

  private buildVisitEmailBody(
    visit: any,
    employee: any,
  ): string {
    const lines: string[] = [];

    lines.push(
      'NEW FIELD ENTRY',
    );

    lines.push(
      '================================',
    );

    lines.push('');

    lines.push(
      `Field Entry ID: ${visit.id}`,
    );

    lines.push(
      `Employee: ${
        employee?.name ||
        visit.employeeId
      }`,
    );

    lines.push(
      `Employee ID: ${visit.employeeId}`,
    );

    lines.push(
      `Customer/Site: ${
        visit.site?.name ||
        'Unknown'
      }`,
    );

    lines.push(
      `Address: ${
        visit.site?.address ||
        'N/A'
      }`,
    );

    lines.push(
      `Date: ${
        new Date(
          visit.timestamp,
        ).toLocaleString()
      }`,
    );

    lines.push('');

    if (
      visit.notes
    ) {
      lines.push(
        'Notes:',
      );
      lines.push(
        visit.notes,
      );
      lines.push('');
    }

    if (
      visit.remarks
    ) {
      lines.push(
        'Remarks:',
      );
      lines.push(
        visit.remarks,
      );
      lines.push('');
    }

    if (
      visit.location
    ) {
      lines.push(
        `GPS: ${visit.location.lat}, ${visit.location.lng}`,
      );

      if (
        visit.location.accuracy !=
        null
      ) {
        lines.push(
          `GPS Accuracy: ${visit.location.accuracy}m`,
        );
      }

      lines.push('');
    }

    if (
      visit.materials?.length
    ) {
      lines.push(
        'Materials:',
      );

      for (
        const material of
          visit.materials
      ) {
        lines.push(
          `- ${
            material.material?.name ||
            'Unknown'
          }: ${
            material.quantity
          } ${
            material.material?.unit ||
            ''
          }`,
        );
      }

      lines.push('');
    }

    if (
      visit.followUps?.length
    ) {
      lines.push(
        'Follow-ups:',
      );

      for (
        const followUp of
          visit.followUps
      ) {
        lines.push(
          `- Due: ${new Date(
            followUp.dueDate,
          ).toLocaleDateString()} | Status: ${
            followUp.status
          }`,
        );

        if (
          followUp.notes
        ) {
          lines.push(
            `  Notes: ${followUp.notes}`,
          );
        }
      }

      lines.push('');
    }

    lines.push(
      '================================',
    );

    lines.push(
      'Sent automatically by Kshetra Field Sales Management System',
    );

    return lines.join('\n');
  }
}