import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardSummary(employeeId: string): Promise<{
        recentVisits: ({
            site: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                address: string;
            };
        } & {
            id: string;
            timestamp: Date;
            notes: string | null;
            employeeId: string;
            customerSiteId: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pendingFollowUps: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            dueDate: Date;
            status: string;
            fieldVisitId: string;
        }[];
    }>;
}
