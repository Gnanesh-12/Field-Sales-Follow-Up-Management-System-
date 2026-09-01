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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
