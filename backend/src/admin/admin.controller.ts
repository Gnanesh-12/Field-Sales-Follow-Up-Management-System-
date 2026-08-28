/*import { Controller, Get, Post, Delete, Patch, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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

  @Get('field-entries')
  getFieldEntries() {
    return this.adminService.getFieldEntries();
  }

  @Patch('field-entries/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateEntryStatus(id, status);
  }
}*/

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';

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

  @Patch('field-entries/:id/status')
  updateEntryStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateEntryStatus(id, status);
  }

  // Add this inside AdminController in backend/src/admin/admin.controller.ts
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