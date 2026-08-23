import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  async listFollowUps(employeeId: string, status?: string) {
    const where: any = {
      visit: { employeeId },
    };
    if (status && status !== 'all') {
      where.status = status;
    }

    return this.prisma.followUp.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        visit: {
          include: { site: true },
        },
      },
    });
  }

  async updateFollowUpStatus(employeeId: string, followUpId: string, status: string) {
    // Verify ownership
    const followUp = await this.prisma.followUp.findFirst({
      where: {
        id: followUpId,
        visit: { employeeId },
      },
    });

    if (!followUp) {
      return null;
    }

    return this.prisma.followUp.update({
      where: { id: followUpId },
      data: { status },
      include: {
        visit: {
          include: { site: true },
        },
      },
    });
  }
}
