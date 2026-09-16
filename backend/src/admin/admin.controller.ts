import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService, private readonly authService: AuthService,) { }

  @Post('auth/register')
  async adminRegister(@Body() body: any) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required.');
    }
    if (body.confirmPassword && body.password !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    return this.authService.adminRegister(body.email, body.password, body.name);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() body: any) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required.');
    }
    return this.authService.adminLogin(body.email, body.password);
  }

  @Get('employees')
  getEmployees() {
    return this.adminService.getEmployees();
  }

  @Post('employees')
  addEmployee(@Body() body: any) {
    return this.adminService.addEmployee(body);
  }

  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string) {
    return this.adminService.deleteEmployee(id);
  }

  @Patch('employees/:id')
  updateEmployee(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateEmployee(id, body);
  }

  @Patch('employees/:id/status')
  toggleStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'INACTIVE') {
    return this.adminService.toggleEmployeeStatus(id, status);
  }

  @Get('field-entries')
  getFieldEntries() {
    return this.adminService.getFieldEntries();
  }

  // Legacy generic status update — kept for backward compatibility
  @Patch('field-entries/:id/status')
  updateEntryStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateEntryStatus(id, status);
  }

  // ─── Approval Workflow ──────────────────────────────────────────────────────

  /**
   * POST /api/admin/field-entries/:id/approve
   * Admin-only: Approve a pending field visit.
   * Requires valid admin JWT. Records which admin approved and when.
   */
  @Post('field-entries/:id/approve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async approveFieldVisit(@Param('id') id: string, @Req() req: any) {
    // Extract admin identity from JWT
    const adminId = req.user?.sub || req.user?.id || req.user?.email || 'admin';
    return this.adminService.approveFieldVisit(id, adminId);
  }

  /**
   * POST /api/admin/field-entries/:id/deny
   * Admin-only: Deny a pending field visit.
   * Requires valid admin JWT. Records which admin denied, when, and optional reason.
   */
  @Post('field-entries/:id/deny')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async denyFieldVisit(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    // Extract admin identity from JWT
    const adminId = req.user?.sub || req.user?.id || req.user?.email || 'admin';
    const reason = body?.reason?.trim() || undefined;
    return this.adminService.denyFieldVisit(id, adminId, reason);
  }

  // ─── Other ─────────────────────────────────────────────────────────────────

  @Patch('auth/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() body: any) {
    return this.authService.changePassword(body);
  }

  @Post('exports')
  async exportRecords(@Body() filters: any) {
    return this.adminService.exportRecords(filters);
  }
}