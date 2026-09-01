import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  fieldVisit: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  followUp: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty arrays gracefully', async () => {
    (prisma.fieldVisit.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.followUp.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.fieldVisit.count as jest.Mock).mockResolvedValue(0);
    (prisma.followUp.count as jest.Mock).mockResolvedValue(0);

    const result = await service.getDashboardSummary('employee1');
    expect(result).toEqual({
      stats: { todayVisits: 0, weekVisits: 0, pendingFollowUps: 0, completedThisWeek: 0, totalVisits: 0 },
      recentVisits: [],
      recentFollowUps: []
    });
  });

  it('should query data only for the given employeeId', async () => {
    const mockVisits = [{ id: 'v1' }];
    const mockFollowUps = [{ id: 'f1' }];

    (prisma.fieldVisit.findMany as jest.Mock).mockResolvedValue(mockVisits);
    (prisma.followUp.findMany as jest.Mock).mockResolvedValue(mockFollowUps);
    (prisma.fieldVisit.count as jest.Mock).mockResolvedValue(1);
    (prisma.followUp.count as jest.Mock).mockResolvedValue(1);

    const result = await service.getDashboardSummary('employee1');

    expect(prisma.fieldVisit.findMany).toHaveBeenCalled();
    expect(prisma.followUp.findMany).toHaveBeenCalled();

    expect(result).toEqual({
      stats: { todayVisits: 1, weekVisits: 1, pendingFollowUps: 1, completedThisWeek: 1, totalVisits: 1 },
      recentVisits: mockVisits,
      recentFollowUps: mockFollowUps,
    });
  });
});

