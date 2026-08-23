import { PrismaService } from '../prisma/prisma.service';
export declare class MaterialsController {
    private prisma;
    constructor(prisma: PrismaService);
    list(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        unit: string;
    }[]>;
}
