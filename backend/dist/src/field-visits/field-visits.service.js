"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldVisitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FieldVisitsService = class FieldVisitsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createVisit(employeeId, data) {
        let site = await this.prisma.customerSite.findFirst({
            where: { name: data.customerSiteName },
        });
        if (!site) {
            site = await this.prisma.customerSite.create({
                data: { name: data.customerSiteName, address: '' },
            });
        }
        let materialEntries = [];
        if (data.materials?.length) {
            for (const m of data.materials) {
                let material = await this.prisma.material.findFirst({
                    where: { name: m.materialName },
                });
                if (!material) {
                    material = await this.prisma.material.create({
                        data: { name: m.materialName, unit: m.unit || 'units' },
                    });
                }
                materialEntries.push({ materialId: material.id, quantity: m.quantity });
            }
        }
        try {
            return await this.prisma.fieldVisit.create({
                data: {
                    id: data.id,
                    employeeId,
                    customerSiteId: site.id,
                    notes: data.notes,
                    remarks: data.remarks,
                    location: (data.lat != null && data.lng != null) ? {
                        create: {
                            lat: data.lat,
                            lng: data.lng,
                            accuracy: data.accuracy,
                        }
                    } : undefined,
                    attachments: data.imageUrl ? {
                        create: {
                            fileUrl: data.imageUrl,
                            type: 'image',
                        }
                    } : undefined,
                    materials: materialEntries.length > 0 ? {
                        create: materialEntries.map(m => ({
                            materialId: m.materialId,
                            quantity: m.quantity,
                        }))
                    } : undefined,
                    followUps: data.followUp ? {
                        create: {
                            notes: data.followUp.notes,
                            dueDate: new Date(data.followUp.dueDate),
                        }
                    } : undefined,
                },
                include: {
                    site: true,
                    location: true,
                    attachments: true,
                    materials: { include: { material: true } },
                    followUps: true,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002' && data.id) {
                return this.prisma.fieldVisit.findUnique({
                    where: { id: data.id },
                    include: {
                        site: true,
                        location: true,
                        attachments: true,
                        materials: { include: { material: true } },
                        followUps: true,
                    },
                });
            }
            throw error;
        }
    }
    async listVisits(employeeId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [visits, total] = await Promise.all([
            this.prisma.fieldVisit.findMany({
                where: { employeeId },
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    site: true,
                    location: true,
                    attachments: true,
                    materials: { include: { material: true } },
                    followUps: true,
                },
            }),
            this.prisma.fieldVisit.count({ where: { employeeId } }),
        ]);
        return { visits, total, page, limit };
    }
    async getVisit(employeeId, visitId) {
        return this.prisma.fieldVisit.findFirst({
            where: { id: visitId, employeeId },
            include: {
                site: true,
                location: true,
                attachments: true,
                materials: { include: { material: true } },
                followUps: true,
            },
        });
    }
    async deleteVisit(employeeId, visitId) {
        const visit = await this.prisma.fieldVisit.findFirst({
            where: { id: visitId, employeeId },
        });
        if (!visit) {
            return { count: 0 };
        }
        await this.prisma.$transaction([
            this.prisma.followUp.deleteMany({ where: { fieldVisitId: visitId } }),
            this.prisma.location.deleteMany({ where: { fieldVisitId: visitId } }),
            this.prisma.attachment.deleteMany({ where: { fieldVisitId: visitId } }),
            this.prisma.materialSupply.deleteMany({ where: { fieldVisitId: visitId } }),
            this.prisma.fieldVisit.delete({ where: { id: visitId } }),
        ]);
        return { count: 1 };
    }
};
exports.FieldVisitsService = FieldVisitsService;
exports.FieldVisitsService = FieldVisitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FieldVisitsService);
//# sourceMappingURL=field-visits.service.js.map