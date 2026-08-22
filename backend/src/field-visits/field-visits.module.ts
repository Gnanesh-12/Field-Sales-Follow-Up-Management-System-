import { Module } from '@nestjs/common';
import { FieldVisitsController } from './field-visits.controller';
import { DashboardService } from './dashboard.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({ secret: 'secret' })],
  controllers: [FieldVisitsController],
  providers: [DashboardService]
})
export class FieldVisitsModule { }
