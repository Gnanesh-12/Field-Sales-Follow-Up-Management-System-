import { Module } from '@nestjs/common';
import { FieldVisitsController } from './field-visits.controller';
import { CustomerSitesController } from './customer-sites.controller';
import { MaterialsController } from './materials.controller';
import { UploadsController } from './uploads.controller';
import { DashboardService } from './dashboard.service';
import { FieldVisitsService } from './field-visits.service';
import { FollowUpsService } from './follow-ups.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: 'secret' })],
  controllers: [
    FieldVisitsController,
    CustomerSitesController,
    MaterialsController,
    UploadsController,
  ],
  providers: [
    DashboardService,
    FieldVisitsService,
    FollowUpsService,
  ],
})
export class FieldVisitsModule {}
