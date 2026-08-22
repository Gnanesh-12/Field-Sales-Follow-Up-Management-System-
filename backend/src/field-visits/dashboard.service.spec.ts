import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  fieldVisit: {
    findMany: jest.fn(),
  },
  followUp: {
    findMany: jest.fn(),
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

    const result = await service.getDashboardSummary('employee1');
    expect(result).toEqual({ recentVisits: [], pendingFollowUps: [] });
  });

  it('should query data only for the given employeeId', async () => {
    const mockVisits = [{ id: 'v1' }];
    const mockFollowUps = [{ id: 'f1' }];

    (prisma.fieldVisit.findMany as jest.Mock).mockResolvedValue(mockVisits);
    (prisma.followUp.findMany as jest.Mock).mockResolvedValue(mockFollowUps);

    const result = await service.getDashboardSummary('employee1');
    
    expect(prisma.fieldVisit.findMany).toHaveBeenCalledWith({
      where: { employeeId: 'employee1' },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { site: true },
    });

    expect(prisma.followUp.findMany).toHaveBeenCalledWith({
      where: {
        visit: { employeeId: 'employee1' },
        status: { not: 'completed' },
      },
      orderBy: { dueDate: 'asc' },
    });

    expect(result).toEqual({
      recentVisits: mockVisits,
      pendingFollowUps: mockFollowUps,
    });
  });
});
