"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldVisitsModule = void 0;
const common_1 = require("@nestjs/common");
const field_visits_controller_1 = require("./field-visits.controller");
const dashboard_service_1 = require("./dashboard.service");
const jwt_1 = require("@nestjs/jwt");
let FieldVisitsModule = class FieldVisitsModule {
};
exports.FieldVisitsModule = FieldVisitsModule;
exports.FieldVisitsModule = FieldVisitsModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_1.JwtModule.register({ secret: 'secret' })],
        controllers: [field_visits_controller_1.FieldVisitsController],
        providers: [dashboard_service_1.DashboardService]
    })
], FieldVisitsModule);
//# sourceMappingURL=field-visits.module.js.map