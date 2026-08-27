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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(body) {
        if (!body.employeeId || !body.pin || !body.name) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        return this.authService.register(body.employeeId, body.pin, body.name);
    }
    async login(body) {
        if (!body.employeeId || !body.pin) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        const user = await this.authService.validateUser(body.employeeId, body.pin);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid Employee ID or PIN');
        }
        return this.authService.login(user);
    }
    async employeeResetPassword(body) {
        if (!body.employeeId || !body.oldPin || !body.newPin) {
            throw new common_1.BadRequestException('Employee ID, old PIN, and new PIN are required');
        }
        return this.authService.employeeResetPassword(body.employeeId, body.oldPin, body.newPin);
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
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('employee/reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "employeeResetPassword", null);
__decorate([
    (0, common_1.Post)('admin/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminRegister", null);
__decorate([
    (0, common_1.Post)('admin/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map