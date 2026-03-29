// src/rhs/rhs.controller.ts
import {
  Controller,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { RhsService } from './rhs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('rhs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RhsController {
  constructor(private readonly rhsService: RhsService) {}

  @Get('my')
  @Roles('MAHASISWA')
  async getMyRHS(@Request() req: RequestWithUser) {
    const studentId = req.user.sub;

    if (!studentId) {
      throw new UnauthorizedException(
        'ID Mahasiswa tidak valid di dalam token.',
      );
    }

    return this.rhsService.getStudentRHS(studentId);
  }
}
