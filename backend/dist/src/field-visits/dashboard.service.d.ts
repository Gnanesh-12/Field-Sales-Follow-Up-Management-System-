import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardSummary(employeeId: string): Promise<{
        stats: {
            todayVisits: number;
            weekVisits: number;
            pendingFollowUps: number;
            completedThisWeek: number;
            totalVisits: number;
        };
        recentVisits: ({
            site: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                address: string;
                geoTag: string | null;
            };
            followUps: {
                status: string;
                id: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                dueDate: Date;
                fieldVisitId: string;
            }[];
            materials: ({
                material: {
                    id: string;
                    createdAt: Date;
                    name: string;
                    unit: string;
                };
            } & {
                id: string;
                fieldVisitId: string;
                quantity: number;
                materialId: string;
            })[];
        } & {
            employeeId: string;
            id: string;
            timestamp: Date;
            notes: string | null;
            remarks: string | null;
            customerSiteId: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        recentFollowUps: ({
            visit: {
                site: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    address: string;
                    geoTag: string | null;
                };
            } & {
                employeeId: string;
                id: string;
                timestamp: Date;
                notes: string | null;
                remarks: string | null;
                customerSiteId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            status: string;
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            dueDate: Date;
            fieldVisitId: string;
        })[];
    }>;
}
