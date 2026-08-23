import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(employeeId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const [
      todayVisits,
      weekVisits,
      pendingFollowUps,
      completedThisWeek,
      recentVisits,
      recentFollowUps,
      totalVisits,
    ] = await Promise.all([
      // Today's visit count
      this.prisma.fieldVisit.count({
        where: {
          employeeId,
          timestamp: { gte: startOfToday },
        },
      }),
      // This week's visit count
      this.prisma.fieldVisit.count({
        where: {
          employeeId,
          timestamp: { gte: startOfWeek },
        },
      }),
      // Pending follow-ups count
      this.prisma.followUp.count({
        where: {
          visit: { employeeId },
          status: 'pending',
        },
      }),
      // Completed follow-ups this week
      this.prisma.followUp.count({
        where: {
          visit: { employeeId },
          status: 'completed',
          updatedAt: { gte: startOfWeek },
        },
      }),
      // Recent visits (last 5)
      this.prisma.fieldVisit.findMany({
        where: { employeeId },
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
          site: true,
          followUps: true,
          materials: { include: { material: true } },
        },
      }),
      // Upcoming follow-ups (next 5 pending)
      this.prisma.followUp.findMany({
        where: {
          visit: { employeeId },
          status: 'pending',
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          visit: { include: { site: true } },
        },
      }),
      // Total visits all-time
      this.prisma.fieldVisit.count({
        where: { employeeId },
      }),
    ]);

    return {
      stats: {
        todayVisits,
        weekVisits,
        pendingFollowUps,
        completedThisWeek,
        totalVisits,
      },
      recentVisits,
      recentFollowUps,
    };
  }
}
