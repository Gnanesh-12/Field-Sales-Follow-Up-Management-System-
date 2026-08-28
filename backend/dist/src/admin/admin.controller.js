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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const auth_service_1 = require("../auth/auth.service");
let AdminController = class AdminController {
    adminService;
    authService;
    constructor(adminService, authService) {
        this.adminService = adminService;
        this.authService = authService;
    }
    async adminRegister(body) {
        if (!body.email || !body.password) {
            throw new common_1.BadRequestException('Email and password are required.');
        }
        if (body.confirmPassword && body.password !== body.confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match.');
        }
        return this.authService.adminRegister(body.email, body.password, body.name);
    }
    async adminLogin(body) {
        if (!body.email || !body.password) {
            throw new common_1.BadRequestException('Email and password are required.');
        }
        return this.authService.adminLogin(body.email, body.password);
    }
    getEmployees() {
        return this.adminService.getEmployees();
    }
    addEmployee(body) {
        return this.adminService.addEmployee(body);
    }
    deleteEmployee(id) {
        return this.adminService.deleteEmployee(id);
    }
    updateEmployee(id, body) {
        return this.adminService.updateEmployee(id, body);
    }
    toggleStatus(id, status) {
        return this.adminService.toggleEmployeeStatus(id, status);
    }
    getFieldEntries() {
        return this.adminService.getFieldEntries();
    }
    updateEntryStatus(id, status) {
        return this.adminService.updateEntryStatus(id, status);
    }
    async changePassword(body) {
        return this.authService.changePassword(body);
    }
    async exportRecords(filters) {
        return this.adminService.exportRecords(filters);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('auth/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adminRegister", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Get)('employees'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getEmployees", null);
__decorate([
    (0, common_1.Post)('employees'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "addEmployee", null);
__decorate([
    (0, common_1.Delete)('employees/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteEmployee", null);
__decorate([
    (0, common_1.Patch)('employees/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateEmployee", null);
__decorate([
    (0, common_1.Patch)('employees/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleStatus", null);
__decorate([
    (0, common_1.Get)('field-entries'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getFieldEntries", null);
__decorate([
    (0, common_1.Patch)('field-entries/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateEntryStatus", null);
__decorate([
    (0, common_1.Patch)('auth/change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('exports'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportRecords", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('api/admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService, auth_service_1.AuthService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map