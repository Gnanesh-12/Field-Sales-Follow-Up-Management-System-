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
    const empIdRegex = /^[a-z]{2}-[a-z]{2}-\d{3}$/;

    if (!empIdRegex.test(rawId)) {
      throw new BadRequestException(
        'Invalid Employee ID format. Expected format: 4 letters, 3 digits with hyphens (e.g., se-fs-001).'
      );
    }

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
        site: true,
        attachments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return entries.map((entry: any) => {
      const siteObj = entry.site || {};
      const photo =
        entry.attachments?.[0]?.url ||
        entry.attachments?.[0]?.filePath ||
        entry.imageUrl ||
        entry.photoUrl ||
        null;

      const remarks = entry.remarks || '';
      let status = 'PENDING';
      if (remarks.includes('STATUS:APPROVED')) status = 'APPROVED';
      else if (remarks.includes('STATUS:REJECTED')) status = 'REJECTED';

      return {
        ...entry,
        siteName: siteObj.name || 'Field Site',
        location: siteObj.geoTag || siteObj.address || siteObj.name || 'Geographical Site',
        imageUrl: photo,
        photoUrl: photo,
        itemsNeeded: remarks.replace(/STATUS:[A-Z]+(\s*\|\s*)?/g, '').trim(),
        status,
      };
    });
  }
  async updateEntryStatus(id: string, status: string) {
    const entry = await (this.prisma as any).fieldVisit.findUnique({
      where: { id },
    });

    if (!entry) throw new BadRequestException('Entry not found');

    const cleanRemarks = (entry.remarks || '').replace(/STATUS:[A-Z]+(\s*\|\s*)?/g, '').trim();
    const updatedRemarks = `STATUS:${status.toUpperCase()} | ${cleanRemarks}`.trim();

    return (this.prisma as any).fieldVisit.update({
      where: { id },
      data: { remarks: updatedRemarks },
    });
  }
}