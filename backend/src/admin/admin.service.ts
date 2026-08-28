/*
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployees() {
    return (this.prisma as any).employee.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addEmployee(data: { name: string; employeeId: string; phone?: string; password: string }) {
    const rawId = (data.employeeId || '').trim().toLowerCase();

    // Enforce 4 letters, 3 digits format (e.g., se-fs-001)
    const empIdRegex = /^[a-z]{2}-[a-z]{2}-\d{3}$/;
    if (!empIdRegex.test(rawId)) {
      throw new BadRequestException(
        'Invalid Employee ID format. Expected format: 4 letters, 3 digits with hyphens (e.g., se-fs-001).'
      );
    }

    // Check uniqueness across both ACTIVE and INACTIVE employees
    const existingEmployee = await (this.prisma as any).employee.findUnique({
      where: { id: rawId },
    });

    if (existingEmployee) {
      throw new BadRequestException(
        `Employee ID "${rawId}" is already registered (status: ${existingEmployee.status}).`
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return (this.prisma as any).employee.create({
      data: {
        id: rawId,
        name: data.name.trim(),
        phone: data.phone?.trim() || '',
        password: hashedPassword,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
  }

  async updateEmployee(id: string, data: { name?: string; phone?: string; password?: string }) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return (this.prisma as any).employee.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleEmployeeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return (this.prisma as any).employee.update({
      where: { id },
      data: { status },
    });
  }

  async getFieldEntries() {
  const entries = await (this.prisma as any).fieldVisit.findMany({
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      customerSite: true,
      site: true,
      attachments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Normalize shape for the frontend
  return entries.map((entry: any) => {
    const siteObj = entry.customerSite || entry.site || {};
    const photo = entry.attachments?.[0]?.url || entry.imageUrl || null;

    return {
      ...entry,
      siteName: siteObj.name || 'Field Site',
      location: siteObj.geoTag || siteObj.address || 'Bengaluru',
      imageUrl: photo,
      photoUrl: photo,
      itemsNeeded: entry.remarks || entry.itemsNeeded || '',
    };
  });
}

  async updateEntryStatus(id: string, status: any) {
    return (this.prisma as any).fieldVisit.update({
      where: { id },
      data: { status },
    });
  }
}*/

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  async getEmployees() {
    return (this.prisma as any).employee.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addEmployee(data: { name: string; phone?: string; password: string }) {
    // Auto-generate ID (SE-FS-XXX)
    const lastEmployee = await (this.prisma as any).employee.findFirst({
      where: { id: { startsWith: 'SE-FS-' } },
      orderBy: { id: 'desc' },
    });

    let nextNum = 1;
    if (lastEmployee) {
      const parts = lastEmployee.id.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }

    const rawId = `SE-FS-${nextNum.toString().padStart(3, '0')}`;

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return (this.prisma as any).employee.create({
      data: {
        id: rawId,
        name: data.name.trim(),
        phone: data.phone?.trim() || '',
        password: hashedPassword,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
  }

  async updateEmployee(id: string, data: { name?: string; phone?: string; password?: string }) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return (this.prisma as any).employee.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteEmployee(id: string) {
    const employee = await (this.prisma as any).employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new BadRequestException(`Employee "${id}" not found.`);
    }

    // Delete related records in order (cascading)
    // 1. Get all field visits for this employee
    const fieldVisits = await (this.prisma as any).fieldVisit.findMany({
      where: { employeeId: id },
      select: { id: true },
    });

    const visitIds = fieldVisits.map((v: any) => v.id);

    if (visitIds.length > 0) {
      // Delete attachments, locations, follow-ups, and material supplies for those visits
      await (this.prisma as any).attachment.deleteMany({ where: { fieldVisitId: { in: visitIds } } });
      await (this.prisma as any).location.deleteMany({ where: { fieldVisitId: { in: visitIds } } });
      await (this.prisma as any).followUp.deleteMany({ where: { fieldVisitId: { in: visitIds } } });
      await (this.prisma as any).materialSupply.deleteMany({ where: { fieldVisitId: { in: visitIds } } });

      // Delete the field visits themselves
      await (this.prisma as any).fieldVisit.deleteMany({ where: { employeeId: id } });
    }

    // Finally delete the employee
    await (this.prisma as any).employee.delete({ where: { id } });

    return { message: `Employee "${id}" has been permanently deleted.` };
  }

  async toggleEmployeeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return (this.prisma as any).employee.update({
      where: { id },
      data: { status },
    });
  }

  async getFieldEntries() {
    const entries = await (this.prisma as any).fieldVisit.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        site: true,
        location: true,
        attachments: true,
        materials: {
          include: { material: true },
        },
        followUps: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return entries.map((entry: any) => {
      const siteObj = entry.site || {};
      const photo =
        entry.attachments?.[0]?.fileUrl ||
        entry.attachments?.[0]?.url ||
        entry.attachments?.[0]?.filePath ||
        entry.imageUrl ||
        entry.photoUrl ||
        null;

      const remarks = entry.remarks || '';
      const status = entry.status || 'PENDING';

      // Format materials for display
      const materialsFormatted = entry.materials?.map((ms: any) => ({
        name: ms.material?.name || 'Unknown',
        unit: ms.material?.unit || '',
        quantity: ms.quantity,
      })) || [];

      return {
        ...entry,
        siteName: siteObj.name || 'Field Site',
        location: siteObj.geoTag || siteObj.address || siteObj.name || 'Geographical Site',
        gpsLat: entry.location?.lat || null,
        gpsLng: entry.location?.lng || null,
        gpsAccuracy: entry.location?.accuracy || null,
        imageUrl: photo,
        photoUrl: photo,
        materialsFormatted,
        itemsNeeded: materialsFormatted.length > 0
          ? materialsFormatted.map((m: any) => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')
          : remarks || 'None',
        followUps: entry.followUps || [],
        status,
      };
    });
  }

  async updateEntryStatus(id: string, status: string) {
    const entry = await (this.prisma as any).fieldVisit.findUnique({
      where: { id },
    });

    if (!entry) throw new BadRequestException('Entry not found');

    return (this.prisma as any).fieldVisit.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });
  }

  async exportRecords(filters: any) {
    // In a real scenario, we'd apply filters here (e.g. date ranges, employee IDs).
    // For now, we fetch all to map to the company template.
    const entries = await this.getFieldEntries();

    // Configurable mapping layer for the 'company template'
    const exportMapping = [
      { header: 'EMP ID', key: (e: any) => e.employee?.id || '' },
      { header: 'Employee Name', key: (e: any) => e.employee?.name || '' },
      { header: 'Date', key: (e: any) => new Date(e.createdAt).toLocaleDateString('en-GB') },
      { header: 'Time', key: (e: any) => new Date(e.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) },
      { header: 'Geographical Location', key: (e: any) => e.location || '' },
      { header: 'Items & Quantity Needed', key: (e: any) => e.itemsNeeded || '' },
      { header: 'Additional Notes', key: (e: any) => e.notes || '' },
      { header: 'Status', key: (e: any) => e.status },
      { header: 'Image URL', key: (e: any) => e.imageUrl || '' },
    ];

    const headers = exportMapping.map(m => m.header).join(',');
    const rows = entries.map((entry: any) => {
      return exportMapping.map(m => {
        const value = m.key(entry) || '';
        // Escape quotes and wrap in quotes for CSV
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    });

    return {
      csvData: [headers, ...rows].join('\n')
    };
  }
}