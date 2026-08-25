import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: any): Promise<any>;
    login(body: any): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            role: any;
        };
    }>;
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
}
