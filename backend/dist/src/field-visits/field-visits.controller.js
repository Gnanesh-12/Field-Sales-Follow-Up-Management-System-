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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldVisitsController = exports.Roles = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const field_visits_service_1 = require("./field-visits.service");
const follow_ups_service_1 = require("./follow-ups.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const common_2 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const Roles = (...roles) => (0, common_2.SetMetadata)('roles', roles);
exports.Roles = Roles;
let FieldVisitsController = class FieldVisitsController {
    dashboardService;
    fieldVisitsService;
    followUpsService;
    prisma;
    constructor(dashboardService, fieldVisitsService, followUpsService, prisma) {
        this.dashboardService = dashboardService;
        this.fieldVisitsService = fieldVisitsService;
        this.followUpsService = followUpsService;
        this.prisma = prisma;
    }
    async getDashboardSummary(req) {
        const employeeId = req.user.sub || req.user.employeeId;
        return this.dashboardService.getDashboardSummary(employeeId);
    }
    async getProfile(req) {
        const employeeId = req.user.sub || req.user.employeeId;
        console.log(`getProfile called for employeeId: ${employeeId}, req.user: ${JSON.stringify(req.user)}`);
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                profilePicture: true,
                createdAt: true,
            },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return employee;
    }
    async createVisit(req, body) {
        const employeeId = req.user.sub || req.user.employeeId;
        if (!body.customerSiteName) {
            throw new common_1.BadRequestException('customerSiteName is required');
        }
        return this.fieldVisitsService.createVisit(employeeId, body);
    }
    async listVisits(req, page, limit) {
        const employeeId = req.user.sub || req.user.employeeId;
        return this.fieldVisitsService.listVisits(employeeId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async getVisit(req, id) {
        const employeeId = req.user.sub || req.user.employeeId;
        const visit = await this.fieldVisitsService.getVisit(employeeId, id);
        if (!visit)
            throw new common_1.NotFoundException('Visit not found');
        return visit;
    }
    async deleteVisit(req, id) {
        const employeeId = req.user.sub || req.user.employeeId;
        const result = await this.fieldVisitsService.deleteVisit(employeeId, id);
        if (result.count === 0)
            throw new common_1.NotFoundException('Visit not found');
        return { success: true };
    }
    async listFollowUps(req, status) {
        const employeeId = req.user.sub || req.user.employeeId;
        return this.followUpsService.listFollowUps(employeeId, status);
    }
    async updateFollowUp(req, id, body) {
        const employeeId = req.user.sub || req.user.employeeId;
        if (!body.status)
            throw new common_1.BadRequestException('status is required');
        const result = await this.followUpsService.updateFollowUpStatus(employeeId, id, body.status);
        if (!result)
            throw new common_1.NotFoundException('Follow-up not found');
        return result;
    }
};
exports.FieldVisitsController = FieldVisitsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('visits'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "createVisit", null);
__decorate([
    (0, common_1.Get)('visits'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "listVisits", null);
__decorate([
    (0, common_1.Get)('visits/:id'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "getVisit", null);
__decorate([
    (0, common_1.Delete)('visits/:id'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "deleteVisit", null);
__decorate([
    (0, common_1.Get)('follow-ups'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "listFollowUps", null);
__decorate([
    (0, common_1.Patch)('follow-ups/:id'),
    (0, exports.Roles)('employee-role', 'EMPLOYEE'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "updateFollowUp", null);
exports.FieldVisitsController = FieldVisitsController = __decorate([
    (0, common_1.Controller)('employees/me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        field_visits_service_1.FieldVisitsService,
        follow_ups_service_1.FollowUpsService,
        prisma_service_1.PrismaService])
], FieldVisitsController);
//# sourceMappingURL=field-visits.controller.js.map