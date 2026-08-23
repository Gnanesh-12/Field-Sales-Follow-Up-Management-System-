import { PrismaService } from '../prisma/prisma.service';
export declare class FollowUpsService {
    private prisma;
    constructor(prisma: PrismaService);
    listFollowUps(employeeId: string, status?: string): Promise<({
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
    })[]>;
    updateFollowUpStatus(employeeId: string, followUpId: string, status: string): Promise<({
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
    }) | null>;
}
