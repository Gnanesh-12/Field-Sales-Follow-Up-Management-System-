import { Controller, Get, Post, Body, UseGuards, BadRequestException, Req, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customer-sites')
@UseGuards(JwtAuthGuard)
export class CustomerSitesController {
  constructor(private prisma: PrismaService) { }

  @Get()
  async list() {
    return this.prisma.customerSite.findMany({
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const employeeId = req.user.sub || req.user.employeeId;
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (employee?.status === 'INACTIVE') {
      throw new ForbiddenException('Your account is temporarily deactivated. You cannot enter new entities.');
    }

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
