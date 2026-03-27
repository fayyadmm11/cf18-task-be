// src/irs/irs.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { IrsService } from './irs.service';
import { CreateIrsDto } from './create-irs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Ubah interface agar fleksibel menerima berbagai kemungkinan nama ID
interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('irs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IrsController {
  constructor(private readonly irsService: IrsService) {}

  @Get()
  @Roles('MAHASISWA')
  async getMyIrs(@Request() req: RequestWithUser) {
    const studentId = req.user.sub;

    if (!studentId) {
      throw new UnauthorizedException(
        'ID Mahasiswa tidak valid di dalam token.',
      );
    }

    return this.irsService.getStudentIrs(studentId);
  }

  @Post()
  @Roles('MAHASISWA')
  async takeCourse(
    @Request() req: RequestWithUser,
    @Body() createIrsDto: CreateIrsDto,
  ) {
    const studentId = req.user.sub;

    if (!studentId) {
      throw new UnauthorizedException(
        'ID Mahasiswa tidak ditemukan di dalam token JWT Anda.',
      );
    }

    const courseId = createIrsDto.courseId;
    return this.irsService.takeCourse(studentId, courseId);
  }

  @Delete(':courseId')
  @Roles('MAHASISWA')
  async dropCourse(
    @Request() req: RequestWithUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const studentId = req.user.sub;

    if (!studentId) {
      throw new UnauthorizedException(
        'ID Mahasiswa tidak ditemukan di dalam token JWT Anda.',
      );
    }

    return this.irsService.dropCourse(studentId, courseId);
  }

  // 👇 TAMBAHAN BARU: Endpoint Dosen dipindah ke ranah IRS
  // GET /irs/courses/:courseId/students
  @Get('courses/:courseId/students')
  @Roles('DOSEN')
  async getCourseStudents(@Param('courseId', ParseIntPipe) courseId: number) {
    // Kita akan memanggil method getCourseStudents dari IrsService
    return this.irsService.getCourseStudents(courseId);
  }
}
