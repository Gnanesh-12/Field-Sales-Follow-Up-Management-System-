import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(employeeId: string, pin: string): Promise<any>;
    register(employeeId: string, pin: string, name: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            role: any;
            isFirstLogin: any;
        };
    }>;
    employeeResetPassword(employeeId: string, oldPin: string, newPin: string): Promise<{
        message: string;
    }>;
    adminRegister(email: string, password: string, name?: string): Promise<{
        message: string;
        token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    adminLogin(email: string, password: string): Promise<{
        message: string;
        token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    changePassword(data: {
        email: string;
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
