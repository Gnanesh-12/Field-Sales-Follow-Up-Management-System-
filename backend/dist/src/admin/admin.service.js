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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEmployees() {
        return this.prisma.employee.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async addEmployee(data) {
        const rawId = (data.employeeId || '').trim().toLowerCase();
        const empIdRegex = /^[a-z]{2}-[a-z]{2}-\d{3}$/;
        if (!empIdRegex.test(rawId)) {
            throw new common_1.BadRequestException('Invalid Employee ID format. Expected format: 4 letters, 3 digits with hyphens (e.g., se-fs-001).');
        }
        const existingEmployee = await this.prisma.employee.findUnique({
            where: { id: rawId },
        });
        if (existingEmployee) {
            throw new common_1.BadRequestException(`Employee ID "${rawId}" is already registered (status: ${existingEmployee.status}).`);
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.employee.create({
            data: {
                id: rawId,
                name: data.name.trim(),
                phone: data.phone?.trim() || '',
                password: hashedPassword,
                role: 'EMPLOYEE',
                status: 'ACTIVE',
            },
        });
    }
    async updateEmployee(id, data) {
        const updateData = {};
        if (data.name)
            updateData.name = data.name.trim();
        if (data.phone !== undefined)
            updateData.phone = data.phone.trim();
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.employee.update({
            where: { id },
            data: updateData,
        });
    }
    async toggleEmployeeStatus(id, status) {
        return this.prisma.employee.update({
            where: { id },
            data: { status },
        });
    }
    async getFieldEntries() {
        const entries = await this.prisma.fieldVisit.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                site: true,
                attachments: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return entries.map((entry) => {
            const siteObj = entry.site || {};
            const photo = entry.attachments?.[0]?.url ||
                entry.attachments?.[0]?.filePath ||
                entry.imageUrl ||
                entry.photoUrl ||
                null;
            const remarks = entry.remarks || '';
            let status = 'PENDING';
            if (remarks.includes('STATUS:APPROVED'))
                status = 'APPROVED';
            else if (remarks.includes('STATUS:REJECTED'))
                status = 'REJECTED';
            return {
                ...entry,
                siteName: siteObj.name || 'Field Site',
                location: siteObj.geoTag || siteObj.address || siteObj.name || 'Geographical Site',
                imageUrl: photo,
                photoUrl: photo,
                itemsNeeded: remarks.replace(/STATUS:[A-Z]+(\s*\|\s*)?/g, '').trim(),
                status,
            };
        });
    }
    async updateEntryStatus(id, status) {
        const entry = await this.prisma.fieldVisit.findUnique({
            where: { id },
        });
        if (!entry)
            throw new common_1.BadRequestException('Entry not found');
        const cleanRemarks = (entry.remarks || '').replace(/STATUS:[A-Z]+(\s*\|\s*)?/g, '').trim();
        const updatedRemarks = `STATUS:${status.toUpperCase()} | ${cleanRemarks}`.trim();
        return this.prisma.fieldVisit.update({
            where: { id },
            data: { remarks: updatedRemarks },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map