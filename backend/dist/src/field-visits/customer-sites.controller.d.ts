import { PrismaService } from '../prisma/prisma.service';
export declare class CustomerSitesController {
    private prisma;
    constructor(prisma: PrismaService);
    list(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string;
        geoTag: string | null;
    }[]>;
    create(req: any, body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string;
        geoTag: string | null;
    }>;
}
