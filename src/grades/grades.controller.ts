// src/grades/grades.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Import DTO (Masih meminjam dari module courses)
import { SetGradingComponentsDto } from './grading.dto';
import { BatchInputGradesDto, PublishGradesDto } from './input-grades.dto';

export interface AuthRequest extends Request {
  user: {
    sub: number;
    name: string;
    email: string;
    role: string;
  };
}

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('courses/:courseId/components')
  @Roles('DOSEN', 'MAHASISWA')
  getGradingComponents(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.gradesService.getGradingComponents(courseId);
  }

  @Patch('courses/:courseId/components')
  @Roles('DOSEN')
  setGradingComponents(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: SetGradingComponentsDto,
    @Req() req: AuthRequest,
  ) {
    return this.gradesService.setGradingComponents(courseId, dto, req.user.sub);
  }

  @Get('courses/:courseId')
  @Roles('DOSEN')
  getCourseGrades(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: AuthRequest,
  ) {
    return this.gradesService.getCourseGrades(courseId, req.user.sub);
  }

  @Post('courses/:courseId')
  @Roles('DOSEN')
  inputGrades(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: BatchInputGradesDto,
    @Req() req: AuthRequest,
  ) {
    return this.gradesService.inputStudentGrades(courseId, dto, req.user.sub);
  }

  @Patch('courses/:courseId/publish')
  @Roles('DOSEN')
  togglePublication(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: PublishGradesDto,
    @Req() req: AuthRequest,
  ) {
    return this.gradesService.toggleGradePublication(
      courseId,
      dto.isPublished,
      req.user.sub,
    );
  }
}
