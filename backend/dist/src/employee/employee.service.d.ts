import { PrismaService } from '../prisma/prisma.service';
export declare class EmployeeService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(employeeId: string): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        name: string;
        phone: string | null;
        profilePicture: string | null;
        role: string;
    }>;
    updateProfilePicture(employeeId: string, profilePictureUrl: string): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        name: string;
        phone: string | null;
        profilePicture: string | null;
        role: string;
    }>;
}
