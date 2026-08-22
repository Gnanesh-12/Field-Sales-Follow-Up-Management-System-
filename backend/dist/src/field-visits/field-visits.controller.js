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
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const common_2 = require("@nestjs/common");
const Roles = (...roles) => (0, common_2.SetMetadata)('roles', roles);
exports.Roles = Roles;
let FieldVisitsController = class FieldVisitsController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getDashboardSummary(req) {
        const employeeId = req.user.employeeId;
        return this.dashboardService.getDashboardSummary(employeeId);
    }
};
exports.FieldVisitsController = FieldVisitsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, exports.Roles)('employee-role'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FieldVisitsController.prototype, "getDashboardSummary", null);
exports.FieldVisitsController = FieldVisitsController = __decorate([
    (0, common_1.Controller)('employees/me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], FieldVisitsController);
//# sourceMappingURL=field-visits.controller.js.map