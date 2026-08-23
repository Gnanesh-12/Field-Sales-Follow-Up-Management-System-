import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(employeeId: string, pin: string, name: string): Promise<{
        message: string;
    }>;
    validateUser(employeeId: string, pin: string): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        phone: string | null;
        role: string;
    } | null>;
    login(user: any): Promise<{
        token: string;
        role: any;
    }>;
}
