import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, NotFoundException, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { FieldVisitsService } from './field-visits.service';
import { FollowUpsService } from './follow-ups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller('employees/me')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FieldVisitsController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly fieldVisitsService: FieldVisitsService,
    private readonly followUpsService: FollowUpsService,
    private readonly prisma: PrismaService,
  ) { }

  // ─── Dashboard ──────────────────────────────────────────
  @Get('dashboard')
  @Roles('employee-role', 'EMPLOYEE')
  async getDashboardSummary(@Req() req) {
    const employeeId = req.user.sub || req.user.employeeId;
    return this.dashboardService.getDashboardSummary(employeeId);
  }

  // ─── Profile ────────────────────────────────────────────
  @Get('profile')
  @Roles('employee-role', 'EMPLOYEE')
  async getProfile(@Req() req) {
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
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  // ─── Field Visits ───────────────────────────────────────
  @Post('visits')
  @Roles('employee-role', 'EMPLOYEE')
  async createVisit(@Req() req, @Body() body: any) {
    const employeeId = req.user.sub || req.user.employeeId;
    if (!body.customerSiteId) {
      throw new BadRequestException('customerSiteId is required');
    }
    return this.fieldVisitsService.createVisit(employeeId, body);
  }

  @Get('visits')
  @Roles('employee-role', 'EMPLOYEE')
  async listVisits(@Req() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    const employeeId = req.user.sub || req.user.employeeId;
    return this.fieldVisitsService.listVisits(
      employeeId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('visits/:id')
  @Roles('employee-role', 'EMPLOYEE')
  async getVisit(@Req() req, @Param('id') id: string) {
    const employeeId = req.user.sub || req.user.employeeId;
    const visit = await this.fieldVisitsService.getVisit(employeeId, id);
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  @Delete('visits/:id')
  @Roles('employee-role', 'EMPLOYEE')
  async deleteVisit(@Req() req, @Param('id') id: string) {
    const employeeId = req.user.sub || req.user.employeeId;
    const result = await this.fieldVisitsService.deleteVisit(employeeId, id);
    if (result.count === 0) throw new NotFoundException('Visit not found');
    return { success: true };
  }

  // ─── Follow-ups ─────────────────────────────────────────
  @Get('follow-ups')
  @Roles('employee-role', 'EMPLOYEE')
  async listFollowUps(@Req() req, @Query('status') status?: string) {
    const employeeId = req.user.sub || req.user.employeeId;
    return this.followUpsService.listFollowUps(employeeId, status);
  }

  @Patch('follow-ups/:id')
  @Roles('employee-role', 'EMPLOYEE')
  async updateFollowUp(@Req() req, @Param('id') id: string, @Body() body: any) {
    const employeeId = req.user.sub || req.user.employeeId;
    if (!body.status) throw new BadRequestException('status is required');
    const result = await this.followUpsService.updateFollowUpStatus(employeeId, id, body.status);
    if (!result) throw new NotFoundException('Follow-up not found');
    return result;
  }
}
