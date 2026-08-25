import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
export declare class AdminController {
    private readonly adminService;
    private readonly authService;
    constructor(adminService: AdminService, authService: AuthService);
    adminRegister(body: any): Promise<{
        message: string;
        token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    adminLogin(body: any): Promise<{
        message: string;
        token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    getEmployees(): Promise<any>;
    addEmployee(body: any): Promise<any>;
    updateEmployee(id: string, body: any): Promise<any>;
    toggleStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<any>;
    getFieldEntries(): Promise<any>;
    updateEntryStatus(id: string, status: string): Promise<any>;
    changePassword(body: any): Promise<{
        message: string;
    }>;
}
