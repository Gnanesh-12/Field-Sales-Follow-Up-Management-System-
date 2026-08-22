import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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
