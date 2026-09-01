import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) { }

  async getProfile(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        profilePicture: true,
        createdAt: true,
      }
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async updateProfilePicture(employeeId: string, profilePictureUrl: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { profilePicture: profilePictureUrl },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        profilePicture: true,
        createdAt: true,
      }
    });
  }
}
