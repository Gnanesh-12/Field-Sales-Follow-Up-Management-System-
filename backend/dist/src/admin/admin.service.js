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
        const lastEmployee = await this.prisma.employee.findFirst({
            where: { id: { startsWith: 'SE-FS-' } },
            orderBy: { id: 'desc' },
        });
        let nextNum = 1;
        if (lastEmployee) {
            const parts = lastEmployee.id.split('-');
            if (parts.length === 3) {
                nextNum = parseInt(parts[2], 10) + 1;
            }
        }
        const rawId = `SE-FS-${nextNum.toString().padStart(3, '0')}`;
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
    async deleteEmployee(id) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
        });
        if (!employee) {
            throw new common_1.BadRequestException(`Employee "${id}" not found.`);
        }
        const fieldVisits = await this.prisma.fieldVisit.findMany({
            where: { employeeId: id },
            select: { id: true },
        });
        const visitIds = fieldVisits.map((v) => v.id);
        if (visitIds.length > 0) {
            await this.prisma.attachment.deleteMany({ where: { fieldVisitId: { in: visitIds } } });
            await this.prisma.location.deleteMany({ where: { fieldVisitId: { in: visitIds } } });
            await this.prisma.followUp.deleteMany({ where: { fieldVisitId: { in: visitIds } } });
            await this.prisma.materialSupply.deleteMany({ where: { fieldVisitId: { in: visitIds } } });
            await this.prisma.fieldVisit.deleteMany({ where: { employeeId: id } });
        }
        await this.prisma.employee.delete({ where: { id } });
        return { message: `Employee "${id}" has been permanently deleted.` };
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
                location: true,
                attachments: true,
                materials: {
                    include: { material: true },
                },
                followUps: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return entries.map((entry) => {
            const siteObj = entry.site || {};
            const photo = entry.attachments?.[0]?.fileUrl ||
                entry.attachments?.[0]?.url ||
                entry.attachments?.[0]?.filePath ||
                entry.imageUrl ||
                entry.photoUrl ||
                null;
            const remarks = entry.remarks || '';
            const status = entry.status || 'PENDING';
            const materialsFormatted = entry.materials?.map((ms) => ({
                name: ms.material?.name || 'Unknown',
                unit: ms.material?.unit || '',
                quantity: ms.quantity,
            })) || [];
            return {
                ...entry,
                siteName: siteObj.name || 'Field Site',
                location: siteObj.geoTag || siteObj.address || siteObj.name || 'Geographical Site',
                gpsLat: entry.location?.lat || null,
                gpsLng: entry.location?.lng || null,
                gpsAccuracy: entry.location?.accuracy || null,
                imageUrl: photo,
                photoUrl: photo,
                materialsFormatted,
                itemsNeeded: materialsFormatted.length > 0
                    ? materialsFormatted.map((m) => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')
                    : remarks || 'None',
                followUps: entry.followUps || [],
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
        return this.prisma.fieldVisit.update({
            where: { id },
            data: { status: status.toUpperCase() },
        });
    }
    async exportRecords(filters) {
        const entries = await this.getFieldEntries();
        const exportMapping = [
            { header: 'EMP ID', key: (e) => e.employee?.id || '' },
            { header: 'Employee Name', key: (e) => e.employee?.name || '' },
            { header: 'Date', key: (e) => new Date(e.createdAt).toLocaleDateString('en-GB') },
            { header: 'Time', key: (e) => new Date(e.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) },
            { header: 'Geographical Location', key: (e) => e.location || '' },
            { header: 'Items & Quantity Needed', key: (e) => e.itemsNeeded || '' },
            { header: 'Additional Notes', key: (e) => e.notes || '' },
            { header: 'Status', key: (e) => e.status },
            { header: 'Image URL', key: (e) => e.imageUrl || '' },
        ];
        const headers = exportMapping.map(m => m.header).join(',');
        const rows = entries.map((entry) => {
            return exportMapping.map(m => {
                const value = m.key(entry) || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',');
        });
        return {
            csvData: [headers, ...rows].join('\n')
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map