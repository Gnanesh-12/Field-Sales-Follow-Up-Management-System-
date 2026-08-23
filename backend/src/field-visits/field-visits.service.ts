import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FieldVisitsService {
  constructor(private prisma: PrismaService) { }

  async createVisit(employeeId: string, data: {
    customerSiteId: string;
    notes?: string;
    remarks?: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
    imageUrl?: string;
    materials?: { materialId: string; quantity: number }[];
    followUp?: { notes: string; dueDate: string };
  }) {
    return this.prisma.fieldVisit.create({
      data: {
        employeeId,
        customerSiteId: data.customerSiteId,
        notes: data.notes,
        remarks: data.remarks,
        location: (data.lat != null && data.lng != null) ? {
          create: {
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
          }
        } : undefined,
        attachments: data.imageUrl ? {
          create: {
            fileUrl: data.imageUrl,
            type: 'image',
          }
        } : undefined,
        materials: data.materials?.length ? {
          create: data.materials.map(m => ({
            materialId: m.materialId,
            quantity: m.quantity,
          }))
        } : undefined,
        followUps: data.followUp ? {
          create: {
            notes: data.followUp.notes,
            dueDate: new Date(data.followUp.dueDate),
          }
        } : undefined,
      },
      include: {
        site: true,
        location: true,
        attachments: true,
        materials: { include: { material: true } },
        followUps: true,
      },
    });
  }

  async listVisits(employeeId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [visits, total] = await Promise.all([
      this.prisma.fieldVisit.findMany({
        where: { employeeId },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          site: true,
          location: true,
          attachments: true,
          materials: { include: { material: true } },
          followUps: true,
        },
      }),
      this.prisma.fieldVisit.count({ where: { employeeId } }),
    ]);

    return { visits, total, page, limit };
  }

  async getVisit(employeeId: string, visitId: string) {
    return this.prisma.fieldVisit.findFirst({
      where: { id: visitId, employeeId },
      include: {
        site: true,
        location: true,
        attachments: true,
        materials: { include: { material: true } },
        followUps: true,
      },
    });
  }

  async deleteVisit(employeeId: string, visitId: string) {
    const visit = await this.prisma.fieldVisit.findFirst({
      where: { id: visitId, employeeId },
    });

    if (!visit) {
      return { count: 0 };
    }

    await this.prisma.$transaction([
      this.prisma.followUp.deleteMany({ where: { fieldVisitId: visitId } }),
      this.prisma.location.deleteMany({ where: { fieldVisitId: visitId } }),
      this.prisma.attachment.deleteMany({ where: { fieldVisitId: visitId } }),
      this.prisma.materialSupply.deleteMany({ where: { fieldVisitId: visitId } }),
      this.prisma.fieldVisit.delete({ where: { id: visitId } }),
    ]);

    return { count: 1 };
  }
}
