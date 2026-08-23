import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customer-sites')
@UseGuards(JwtAuthGuard)
export class CustomerSitesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.customerSite.findMany({
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async create(@Body() body: any) {
    if (!body.name || !body.address) {
      throw new BadRequestException('name and address are required');
    }
    return this.prisma.customerSite.create({
      data: {
        name: body.name,
        address: body.address,
        geoTag: body.geoTag,
      },
    });
  }
}
