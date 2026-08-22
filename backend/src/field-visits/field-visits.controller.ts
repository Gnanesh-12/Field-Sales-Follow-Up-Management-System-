import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller('employees/me')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FieldVisitsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @Roles('employee-role')
  async getDashboardSummary(@Req() req) {
    const employeeId = req.user.employeeId;
    return this.dashboardService.getDashboardSummary(employeeId);
  }
}
