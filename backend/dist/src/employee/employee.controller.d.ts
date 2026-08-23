import { EmployeeService } from './employee.service';
export declare class EmployeeController {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    uploadProfilePicture(req: any, file: any): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        name: string;
        phone: string | null;
        profilePicture: string | null;
        role: string;
    }>;
}
