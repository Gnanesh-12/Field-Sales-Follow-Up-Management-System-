import { DashboardService } from './dashboard.service';
import { FieldVisitsService } from './field-visits.service';
import { FollowUpsService } from './follow-ups.service';
import { PrismaService } from '../prisma/prisma.service';
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class FieldVisitsController {
    private readonly dashboardService;
    private readonly fieldVisitsService;
    private readonly followUpsService;
    private readonly prisma;
    constructor(dashboardService: DashboardService, fieldVisitsService: FieldVisitsService, followUpsService: FollowUpsService, prisma: PrismaService);
    getDashboardSummary(req: any): Promise<{
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
    getProfile(req: any): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        name: string;
        phone: string | null;
        role: string;
    }>;
    createVisit(req: any, body: any): Promise<{
        location: {
            id: string;
            fieldVisitId: string;
            lat: number;
            lng: number;
            accuracy: number | null;
        } | null;
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
        attachments: {
            id: string;
            createdAt: Date;
            fieldVisitId: string;
            fileUrl: string;
            type: string;
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
    }>;
    listVisits(req: any, page?: string, limit?: string): Promise<{
        visits: ({
            location: {
                id: string;
                fieldVisitId: string;
                lat: number;
                lng: number;
                accuracy: number | null;
            } | null;
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
            attachments: {
                id: string;
                createdAt: Date;
                fieldVisitId: string;
                fileUrl: string;
                type: string;
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
        total: number;
        page: number;
        limit: number;
    }>;
    getVisit(req: any, id: string): Promise<{
        location: {
            id: string;
            fieldVisitId: string;
            lat: number;
            lng: number;
            accuracy: number | null;
        } | null;
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
        attachments: {
            id: string;
            createdAt: Date;
            fieldVisitId: string;
            fileUrl: string;
            type: string;
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
    }>;
    deleteVisit(req: any, id: string): Promise<{
        success: boolean;
    }>;
    listFollowUps(req: any, status?: string): Promise<({
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
    updateFollowUp(req: any, id: string, body: any): Promise<{
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
    }>;
}
