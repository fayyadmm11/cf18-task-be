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
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Import DTO (Masih meminjam dari module courses)
import { SetGradingComponentsDto } from './grading.dto';
import { BatchInputGradesDto, PublishGradesDto } from './input-grades.dto';

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
  ) {
    return this.gradesService.setGradingComponents(courseId, dto);
  }

  @Get('courses/:courseId')
  @Roles('DOSEN')
  getCourseGrades(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.gradesService.getCourseGrades(courseId);
  }

  @Post('courses/:courseId')
  @Roles('DOSEN')
  inputGrades(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: BatchInputGradesDto,
  ) {
    return this.gradesService.inputStudentGrades(courseId, dto);
  }

  @Patch('courses/:courseId/publish')
  @Roles('DOSEN')
  togglePublication(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: PublishGradesDto,
  ) {
    return this.gradesService.toggleGradePublication(courseId, dto.isPublished);
  }
}
