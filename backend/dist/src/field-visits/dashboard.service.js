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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardSummary(employeeId) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const [todayVisits, weekVisits, pendingFollowUps, completedThisWeek, recentVisits, recentFollowUps, totalVisits,] = await Promise.all([
            this.prisma.fieldVisit.count({
                where: {
                    employeeId,
                    timestamp: { gte: startOfToday },
                },
            }),
            this.prisma.fieldVisit.count({
                where: {
                    employeeId,
                    timestamp: { gte: startOfWeek },
                },
            }),
            this.prisma.followUp.count({
                where: {
                    visit: { employeeId },
                    status: 'pending',
                },
            }),
            this.prisma.followUp.count({
                where: {
                    visit: { employeeId },
                    status: 'completed',
                    updatedAt: { gte: startOfWeek },
                },
            }),
            this.prisma.fieldVisit.findMany({
                where: { employeeId },
                take: 5,
                orderBy: { timestamp: 'desc' },
                include: {
                    site: true,
                    followUps: true,
                    materials: { include: { material: true } },
                },
            }),
            this.prisma.followUp.findMany({
                where: {
                    visit: { employeeId },
                    status: 'pending',
                },
                take: 5,
                orderBy: { dueDate: 'asc' },
                include: {
                    visit: { include: { site: true } },
                },
            }),
            this.prisma.fieldVisit.count({
                where: { employeeId },
            }),
        ]);
        return {
            stats: {
                todayVisits,
                weekVisits,
                pendingFollowUps,
                completedThisWeek,
                totalVisits,
            },
            recentVisits,
            recentFollowUps,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map