import { Injectable, ForbiddenException } from '@nestjs/common';
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
    // Verify ownership — find follow-up that belongs to this employee
    const followUp = await this.prisma.followUp.findFirst({
      where: {
        id: followUpId,
        visit: { employeeId },
      },
      include: {
        visit: true,
      },
    });

    if (!followUp) {
      return null;
    }

    // ─── APPROVAL ENFORCEMENT ─────────────────────────────────────────────────
    // The parent field visit must be APPROVED before follow-up work can be updated.
    // Backend enforces this rule regardless of what the Flutter client sends.
    const visitStatus = (followUp.visit as any)?.status || 'PENDING';

    if (visitStatus === 'PENDING') {
      throw new ForbiddenException(
        'This field visit is pending Admin approval. You cannot update follow-up work until the visit is approved.'
      );
    }

    if (visitStatus === 'DENIED' || visitStatus === 'REJECTED') {
      throw new ForbiddenException(
        'This field visit was denied by Admin. Follow-up work is not allowed for denied visits.'
      );
    }

    if (visitStatus !== 'APPROVED') {
      throw new ForbiddenException(
        `Follow-up work is not allowed. Field visit status is: ${visitStatus}`
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

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
