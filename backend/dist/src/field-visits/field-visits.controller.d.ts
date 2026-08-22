import { DashboardService } from './dashboard.service';
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class FieldVisitsController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardSummary(req: any): Promise<{
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
