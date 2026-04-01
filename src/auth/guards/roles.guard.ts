// src/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface UserWithRole {
  id: number;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: UserWithRole;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Baca metadata role yang dibutuhkan dari decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Jika endpoint tidak punya label @Roles(), berarti API tersebut publik/bebas, izinkan masuk.
    if (!requiredRoles) {
      return true;
    }

    // 3. Ambil data user yang sudah diekstrak oleh JwtStrategy
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Jika entah bagaimana tidak ada user (mungkin lupa pasang JwtAuthGuard), tolak!
    if (!user) {
      throw new ForbiddenException('Akses ditolak: User tidak teridentifikasi');
    }

    // 4. Cek apakah role user saat ini ada di dalam daftar role yang diizinkan
    const hasRole: boolean = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Akses ditolak: Fitur ini hanya untuk ${requiredRoles.join(' atau ')}`,
      );
    }

    return true; // Lolos pemeriksaan!
  }
}
