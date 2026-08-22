import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
