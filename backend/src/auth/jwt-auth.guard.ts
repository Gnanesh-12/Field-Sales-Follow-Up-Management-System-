import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// A mock JWT Auth Guard for the sake of the dashboard implementation
// In a real app, you would use @nestjs/passport and PassportStrategy(Strategy, 'jwt')

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      request.user = { employeeId: 'mock-employee-id', role: 'employee-role' };
      return true;
    }
    
    try {
      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.verify(token, { secret: 'secret' });
      request.user = decoded;
      return true;
    } catch (e) {
      // For local testing, allow it and mock a user if token is invalid
      request.user = { employeeId: 'mock-employee-id', role: 'employee-role' };
      return true;
    }
  }
}
