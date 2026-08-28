/*import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() body: any) {
    if (!body.employeeId || !body.pin || !body.name) {
      throw new BadRequestException('Missing required fields');
    }
    return this.authService.register(body.employeeId, body.pin, body.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    if (!body.employeeId || !body.pin) {
      throw new BadRequestException('Missing required fields');
    }
    const user = await this.authService.validateUser(body.employeeId, body.pin);
    if (!user) {
      throw new UnauthorizedException('Invalid Employee ID or PIN');
    }
    return this.authService.login(user);
  }
}
*/

import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ===============================
  // EMPLOYEE AUTH (UNCHANGED)
  // ===============================
  @Post('register')
  async register(@Body() body: any) {
    if (!body.employeeId || !body.pin || !body.name) {
      throw new BadRequestException('Missing required fields');
    }
    return this.authService.register(body.employeeId, body.pin, body.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    if (!body.employeeId || !body.pin) {
      throw new BadRequestException('Missing required fields');
    }
    const empId = body.employeeId.toUpperCase();
    const employeeIdRegex = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;
    if (!employeeIdRegex.test(empId)) {
      throw new BadRequestException('Employee ID must be in the format SE-FS-001');
    }
    const user = await this.authService.validateUser(empId, body.pin);
    if (!user) {
      throw new UnauthorizedException('Invalid Employee ID or PIN');
    }
    return this.authService.login(user);
  }

  @Post('employee/reset-password')
  async employeeResetPassword(@Body() body: any) {
    if (!body.employeeId || !body.oldPin || !body.newPin) {
      throw new BadRequestException('Employee ID, old PIN, and new PIN are required');
    }
    return this.authService.employeeResetPassword(body.employeeId, body.oldPin, body.newPin);
  }

  // ===============================
  // ADMIN AUTH (EMAIL & PASSWORD)
  // ===============================
  @Post('admin/register')
  async adminRegister(@Body() body: any) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required.');
    }
    if (body.confirmPassword && body.password !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    return this.authService.adminRegister(body.email, body.password, body.name);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() body: any) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required.');
    }
    return this.authService.adminLogin(body.email, body.password);
  }
}