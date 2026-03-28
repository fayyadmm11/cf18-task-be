// src/courses/courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './create-course.dto';
import { UpdateCourseDto } from './update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Kontrak tipe data agar TypeScript tahu persis isi dari Token JWT
export interface AuthRequest extends Request {
  user: {
    sub: number; // ID User
    name: string;
    email: string;
    role: string;
  };
}

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // GET /courses -> Sekarang mendukung Pagination (?page=X&limit=Y)
  @Get()
  @Roles('DOSEN', 'MAHASISWA')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.coursesService.findAll(pageNumber, limitNumber);
  }

  // 👇 Tambahkan endpoint ini untuk mengambil daftar peserta kelas
  @Get(':courseId/participants')
  @Roles('DOSEN')
  getCourseParticipants(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.getCourseParticipants(courseId);
  }

  // POST /courses -> HANYA Dosen
  @Post()
  @Roles('DOSEN')
  create(@Body() createCourseDto: CreateCourseDto, @Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.coursesService.create(createCourseDto, userId);
  }

  // PATCH /courses/:id -> HANYA Dosen
  @Patch(':id')
  @Roles('DOSEN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  // DELETE /courses/:id -> HANYA Dosen
  @Delete(':id')
  @Roles('DOSEN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}
