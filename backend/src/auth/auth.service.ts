/*import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) { }

  async register(employeeId: string, pin: string, name: string) {
    const existing = await this.prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (existing) {
      throw new ConflictException('Employee ID already exists');
    }

    const newEmployee = await this.prisma.employee.create({
      data: {
        id: employeeId,
        password: pin, // In production, hash this!
        name,
      },
    });

    return { message: 'Registration successful' };
  }

  async validateUser(employeeId: string, pin: string) {
    const user = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (user && user.password === pin) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { employeeId: user.id, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      role: user.role,
    };
  }
}
*/

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  // ==========================================
  // EXISTING EMPLOYEE METHODS (LEAVE AS IS)
  // ==========================================
  async validateUser(employeeId: string, pin: string) {
    const employee = await (this.prisma as any).employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) return null;

    // Check pin / password
    const isMatch = await bcrypt.compare(pin, employee.password).catch(() => false) || employee.password === pin;
    if (isMatch) return employee;
    return null;
  }

  async register(employeeId: string, pin: string, name: string) {
    const hashedPin = await bcrypt.hash(pin, 10);
    return (this.prisma as any).employee.create({
      data: {
        id: employeeId,
        name,
        password: hashedPin,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });
  }

  async login(user: any) {
    const payload = { sub: user.id, name: user.name, role: user.role, isFirstLogin: user.isFirstLogin };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      },
    };
  }

  async employeeResetPassword(employeeId: string, oldPin: string, newPin: string) {
    if (!employeeId || !oldPin || !newPin) {
      throw new BadRequestException('Employee ID, current PIN, and new PIN are required.');
    }

    const user = await (this.prisma as any).employee.findUnique({
      where: { id: employeeId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid Employee ID or account does not exist.');
    }

    const isMatch = await bcrypt.compare(oldPin, user.password).catch(() => false) || user.password === oldPin;
    if (!isMatch) {
      throw new UnauthorizedException('Current PIN is incorrect.');
    }

    const hashedNewPin = await bcrypt.hash(newPin, 10);

    await (this.prisma as any).employee.update({
      where: { id: employeeId },
      data: { password: hashedNewPin, isFirstLogin: false },
    });

    return { message: 'Password updated successfully! You can now access the full app.' };
  }

  // ==========================================
  // ADMIN AUTH METHODS (USING ID AS EMAIL)
  // ==========================================
  async adminRegister(email: string, password: string, name?: string) {
    const cleanEmail = email.trim().toLowerCase();

    // Check if an account already exists
    const existing = await (this.prisma as any).admin.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      throw new BadRequestException('An account with this email already exists.');
    }

    // Hash password with bcrypt salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (this.prisma as any).admin.create({
      data: {
        id: `ADM-${Date.now()}`,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      name: user.name,
      role: user.role,
    });

    return {
      message: 'Admin registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async adminLogin(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    const user = await (this.prisma as any).admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      name: user.name,
      role: user.role,
    });

    return {
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async changePassword(data: { email: string; oldPassword: string; newPassword: string }) {
    const cleanEmail = data.email.trim().toLowerCase();

    if (!cleanEmail || !data.oldPassword || !data.newPassword) {
      throw new BadRequestException('Email, current password, and new password are required.');
    }

    const user = await (this.prisma as any).admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or account does not exist.');
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.password).catch(() => false);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    await (this.prisma as any).admin.update({
      where: { email: cleanEmail },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password updated successfully! You can now log in with your new password.' };
  }

}