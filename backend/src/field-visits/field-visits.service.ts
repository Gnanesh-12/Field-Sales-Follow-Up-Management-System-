import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FieldVisitsService {
  constructor(private prisma: PrismaService) { }

  async createVisit(employeeId: string, data: {
    id?: string;
    customerSiteName: string;
    notes?: string;
    remarks?: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
    imageUrl?: string;
    materials?: { materialName: string; unit?: string; quantity: number }[];
    followUp?: { notes: string; dueDate: string };
  }) {
    // Find or create CustomerSite by name
    let site = await this.prisma.customerSite.findFirst({
      where: { name: data.customerSiteName },
    });
    if (!site) {
      site = await this.prisma.customerSite.create({
        data: { name: data.customerSiteName, address: '' },
      });
    }

    // Resolve material IDs (find or create each material by name)
    let materialEntries: { materialId: string; quantity: number }[] = [];
    if (data.materials?.length) {
      for (const m of data.materials) {
        let material = await this.prisma.material.findFirst({
          where: { name: m.materialName },
        });
        if (!material) {
          material = await this.prisma.material.create({
            data: { name: m.materialName, unit: m.unit || 'units' },
          });
        }
        materialEntries.push({ materialId: material.id, quantity: m.quantity });
      }
    }

    return this.prisma.fieldVisit.create({
      data: {
        id: data.id,
        employeeId,
        customerSiteId: site.id,
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
        materials: materialEntries.length > 0 ? {
          create: materialEntries.map(m => ({
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
