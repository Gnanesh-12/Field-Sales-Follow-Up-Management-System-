import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FieldVisitsModule } from './field-visits/field-visits.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdminModule } from './admin/admin.module'; //change made
import { EmailModule } from './email/email.module'; // Phase 1 Email Integration

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FieldVisitsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    AuthModule,
    EmployeeModule,
    AdminModule, //change made
    EmailModule, // Phase 1 Email Integration
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

