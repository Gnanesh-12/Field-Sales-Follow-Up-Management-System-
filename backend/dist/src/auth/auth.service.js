"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(employeeId, pin) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee)
            return null;
        const isMatch = await bcrypt.compare(pin, employee.password).catch(() => false) || employee.password === pin;
        if (isMatch)
            return employee;
        return null;
    }
    async register(employeeId, pin, name) {
        const hashedPin = await bcrypt.hash(pin, 10);
        return this.prisma.employee.create({
            data: {
                id: employeeId,
                name,
                password: hashedPin,
                role: 'EMPLOYEE',
                status: 'ACTIVE',
            },
        });
    }
    async login(user) {
        const payload = { sub: user.id, name: user.name, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
            },
        };
    }
    async adminRegister(email, password, name) {
        const cleanEmail = email.trim().toLowerCase();
        const existing = await this.prisma.employee.findUnique({
            where: { id: cleanEmail },
        });
        if (existing) {
            throw new common_1.BadRequestException('An account with this email already exists.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.employee.create({
            data: {
                id: cleanEmail,
                name: name?.trim() || cleanEmail.split('@')[0],
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        const token = this.jwtService.sign({
            sub: user.id,
            name: user.name,
            role: user.role,
        });
        return {
            message: 'Admin registered successfully',
            token,
            user: {
                id: user.id,
                email: user.id,
                name: user.name,
                role: user.role,
            },
        };
    }
    async adminLogin(email, password) {
        const cleanEmail = email.trim().toLowerCase();
        const user = await this.prisma.employee.findUnique({
            where: { id: cleanEmail },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const token = this.jwtService.sign({
            sub: user.id,
            name: user.name,
            role: user.role,
        });
        return {
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                email: user.id,
                name: user.name,
                role: user.role,
            },
        };
    }
    async changePassword(data) {
        const cleanEmail = data.email.trim().toLowerCase();
        if (!cleanEmail || !data.oldPassword || !data.newPassword) {
            throw new common_1.BadRequestException('Email, current password, and new password are required.');
        }
        const user = await this.prisma.employee.findUnique({
            where: { id: cleanEmail },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid email or account does not exist.');
        }
        const isMatch = await bcrypt.compare(data.oldPassword, user.password).catch(() => false);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Current password is incorrect.');
        }
        const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
        await this.prisma.employee.update({
            where: { id: cleanEmail },
            data: { password: hashedNewPassword },
        });
        return { message: 'Password updated successfully! You can now log in with your new password.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map