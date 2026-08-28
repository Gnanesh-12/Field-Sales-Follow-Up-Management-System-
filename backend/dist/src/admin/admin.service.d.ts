import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getEmployees(): Promise<any>;
    addEmployee(data: {
        name: string;
        phone?: string;
        password: string;
    }): Promise<any>;
    updateEmployee(id: string, data: {
        name?: string;
        phone?: string;
        password?: string;
    }): Promise<any>;
    deleteEmployee(id: string): Promise<{
        message: string;
    }>;
    toggleEmployeeStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<any>;
    getFieldEntries(): Promise<any>;
    updateEntryStatus(id: string, status: string): Promise<any>;
    exportRecords(filters: any): Promise<{
        csvData: string;
    }>;
}
