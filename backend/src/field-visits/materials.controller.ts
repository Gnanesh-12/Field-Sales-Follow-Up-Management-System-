import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.material.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
