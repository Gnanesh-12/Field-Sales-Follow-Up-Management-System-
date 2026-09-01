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
const customer_sites_controller_1 = require("./customer-sites.controller");
const materials_controller_1 = require("./materials.controller");
const uploads_controller_1 = require("./uploads.controller");
const dashboard_service_1 = require("./dashboard.service");
const field_visits_service_1 = require("./field-visits.service");
const follow_ups_service_1 = require("./follow-ups.service");
const jwt_1 = require("@nestjs/jwt");
let FieldVisitsModule = class FieldVisitsModule {
};
exports.FieldVisitsModule = FieldVisitsModule;
exports.FieldVisitsModule = FieldVisitsModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_1.JwtModule.register({ secret: process.env.JWT_SECRET })],
        controllers: [
            field_visits_controller_1.FieldVisitsController,
            customer_sites_controller_1.CustomerSitesController,
            materials_controller_1.MaterialsController,
            uploads_controller_1.UploadsController,
        ],
        providers: [
            dashboard_service_1.DashboardService,
            field_visits_service_1.FieldVisitsService,
            follow_ups_service_1.FollowUpsService,
        ],
    })
], FieldVisitsModule);
//# sourceMappingURL=field-visits.module.js.map