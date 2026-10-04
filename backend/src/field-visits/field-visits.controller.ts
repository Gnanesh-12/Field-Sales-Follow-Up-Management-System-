import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';
import { FieldVisitsService } from './field-visits.service';
import { FollowUpsService } from './follow-ups.service';
import { FieldVisitCustomerEmailService } from './field-visit-customer-email.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

export const Roles = (...roles: string[]) =>
  SetMetadata('roles', roles);

@Controller('employees/me')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FieldVisitsController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly fieldVisitsService: FieldVisitsService,
    private readonly followUpsService: FollowUpsService,
    private readonly prisma: PrismaService,
    private readonly fieldVisitCustomerEmailService: FieldVisitCustomerEmailService,
  ) {}

  // ─── Dashboard ──────────────────────────────────────────

  @Get('dashboard')
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async getDashboardSummary(
    @Req() req,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.dashboardService.getDashboardSummary(
      employeeId,
    );
  }

  // ─── Field Visits ───────────────────────────────────────

  @Post('visits')
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async createVisit(
    @Req() req,
    @Body() body: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    const employee =
      await this.prisma.employee.findUnique({
        where: {
          id: employeeId,
        },
      });

    if (
      employee?.status ===
      'INACTIVE'
    ) {
      throw new ForbiddenException(
        'Your account is temporarily deactivated. You cannot enter new entities.',
      );
    }

    if (!body.customerSiteName) {
      throw new BadRequestException(
        'customerSiteName is required',
      );
    }

    /*
     * These fields are used only for the optional
     * customer email copy.
     *
     * They are removed before the normal field
     * visit creation flow so the existing flow
     * remains unchanged.
     */
    const sendToCustomer =
      body.sendToCustomer === true;

    const customerEmail =
      typeof body.customerEmail ===
      'string'
        ? body.customerEmail.trim()
        : '';

    /*
     * SECURITY:
     * Strip any employee-provided approval status.
     *
     * Approval status is ALWAYS set to PENDING
     * on new submissions.
     */
    const {
      status,
      approvalStatus,
      approvedBy,
      approvedAt,
      deniedBy,
      deniedAt,
      denialReason,
      sendToCustomer: _sendToCustomer,
      customerEmail: _customerEmail,
      ...safeBody
    } = body;

    let createdVisit: any;

    try {
      /*
       * THIS IS THE EXISTING FIELD VISIT FLOW.
       * Do not replace or bypass it.
       */
      createdVisit =
        await this.fieldVisitsService.createVisit(
          employeeId,
          safeBody,
        );
    } catch (error) {
      console.error(
        'CREATE VISIT ERROR:',
        error,
      );

      throw new BadRequestException(
        error.message ||
          'Error creating visit',
      );
    }

    /*
     * Customer email is ADDITIVE.
     *
     * The visit has already been successfully
     * created and therefore Admin receives it
     * exactly as before.
     *
     * If customer email fails, we DO NOT delete
     * or undo the field visit.
     */
    if (
      sendToCustomer &&
      customerEmail
    ) {
      try {
        const emailResult =
          await this.fieldVisitCustomerEmailService.sendCustomerCopy(
            employeeId,
            createdVisit.id,
            customerEmail,
          );

        return {
          ...createdVisit,
          customerEmail: {
            attempted: true,
            success: true,
            recipientEmail:
              emailResult.recipientEmail,
            status:
              emailResult.status,
            emailLogId:
              emailResult.emailLogId,
            gmailMessageId:
              emailResult.gmailMessageId,
          },
        };
      } catch (error) {
        console.error(
          'CUSTOMER EMAIL ERROR:',
          error,
        );

        return {
          ...createdVisit,
          customerEmail: {
            attempted: true,
            success: false,
            recipientEmail:
              customerEmail,
            error:
              error?.message ||
              'Failed to send customer email',
          },
        };
      }
    }

    /*
     * Original behavior when customer email
     * is not requested.
     */
    return {
      ...createdVisit,
      customerEmail: {
        attempted: false,
        success: false,
      },
    };
  }

  @Get('visits')
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async listVisits(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.fieldVisitsService.listVisits(
      employeeId,
      page
        ? parseInt(page, 10)
        : 1,
      limit
        ? parseInt(limit, 10)
        : 20,
    );
  }

  @Get('visits/:id')
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async getVisit(
    @Req() req,
    @Param('id') id: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    const visit =
      await this.fieldVisitsService.getVisit(
        employeeId,
        id,
      );

    if (!visit) {
      throw new NotFoundException(
        'Visit not found',
      );
    }

    return visit;
  }

  @Delete('visits/:id')
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async deleteVisit(
    @Req() req,
    @Param('id') id: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    const employee =
      await this.prisma.employee.findUnique({
        where: {
          id: employeeId,
        },
      });

    if (
      employee?.status ===
      'INACTIVE'
    ) {
      throw new ForbiddenException(
        'Your account is temporarily deactivated. You cannot delete entities.',
      );
    }

    const result =
      await this.fieldVisitsService.deleteVisit(
        employeeId,
        id,
      );

    if (result.count === 0) {
      throw new NotFoundException(
        'Visit not found',
      );
    }

    return {
      success: true,
    };
  }

  // ─── Follow-ups ─────────────────────────────────────────

  @Get('follow-ups')
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async listFollowUps(
    @Req() req,
    @Query('status') status?: string,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    return this.followUpsService.listFollowUps(
      employeeId,
      status,
    );
  }

  @Patch('follow-ups/:id')
  @Roles(
    'employee-role',
    'EMPLOYEE',
  )
  async updateFollowUp(
    @Req() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const employeeId =
      req.user.sub ||
      req.user.employeeId;

    const employee =
      await this.prisma.employee.findUnique({
        where: {
          id: employeeId,
        },
      });

    if (
      employee?.status ===
      'INACTIVE'
    ) {
      throw new ForbiddenException(
        'Your account is temporarily deactivated. You cannot modify entities.',
      );
    }

    if (!body.status) {
      throw new BadRequestException(
        'status is required',
      );
    }

    const result =
      await this.followUpsService.updateFollowUpStatus(
        employeeId,
        id,
        body.status,
      );

    if (!result) {
      throw new NotFoundException(
        'Follow-up not found',
      );
    }

    return result;
  }
}