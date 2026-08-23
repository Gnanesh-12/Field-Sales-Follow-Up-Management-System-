import { PrismaService } from '../prisma/prisma.service';
export declare class FieldVisitsService {
    private prisma;
    constructor(prisma: PrismaService);
    createVisit(employeeId: string, data: {
        customerSiteId: string;
        notes?: string;
        remarks?: string;
        lat?: number;
        lng?: number;
        accuracy?: number;
        imageUrl?: string;
        materials?: {
            materialId: string;
            quantity: number;
        }[];
        followUp?: {
            notes: string;
            dueDate: string;
        };
    }): Promise<{
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
    listVisits(employeeId: string, page?: number, limit?: number): Promise<{
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
    getVisit(employeeId: string, visitId: string): Promise<({
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
    }) | null>;
    deleteVisit(employeeId: string, visitId: string): Promise<{
        count: number;
    }>;
}
