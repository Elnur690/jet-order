import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // This guard should run AFTER JwtAuthGuard, so `request.user` will be populated.
    if (user && user.role === UserRole.ADMIN) {
      return true; // Allow access
    }

    // If user is not an admin, deny access.
    throw new ForbiddenException('You do not have permission to perform this action.');
  }
}