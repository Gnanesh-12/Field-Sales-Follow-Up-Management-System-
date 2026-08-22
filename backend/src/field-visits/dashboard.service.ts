import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(employeeId: string) {
    const recentVisits = await this.prisma.fieldVisit.findMany({
      where: { employeeId },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { site: true },
    });

    const pendingFollowUps = await this.prisma.followUp.findMany({
      where: {
        visit: { employeeId },
        status: { not: 'completed' },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      recentVisits,
      pendingFollowUps,
    };
  }
}
