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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Courses')
@ApiBearerAuth('access-token')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // GET /courses -> Sekarang mendukung Pagination (?page=X&limit=Y)
  @Get()
  @Roles('DOSEN', 'MAHASISWA')
  @ApiOperation({
    summary: 'Get all courses',
    description: 'Mendapatkan daftar semua courses dengan support pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Nomor halaman (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah data per halaman (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of courses',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token tidak valid atau tidak tersedia',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User tidak memiliki role yang sesuai',
  })
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
  @ApiOperation({
    summary: 'Get course participants',
    description:
      'Mendapatkan daftar peserta dari sebuah course (hanya untuk DOSEN)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of participants',
  })
  getCourseParticipants(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.getCourseParticipants(courseId);
  }

  // POST /courses -> HANYA Dosen
  @Post()
  @Roles('DOSEN')
  @ApiOperation({
    summary: 'Create new course',
    description: 'Membuat course baru (hanya untuk DOSEN)',
  })
  @ApiBody({
    type: CreateCourseDto,
    description: 'Data course yang akan dibuat',
  })
  @ApiResponse({
    status: 201,
    description: 'Course berhasil dibuat',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body',
  })
  create(@Body() createCourseDto: CreateCourseDto, @Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.coursesService.create(createCourseDto, userId);
  }

  // PATCH /courses/:id -> HANYA Dosen
  @Patch(':id')
  @Roles('DOSEN')
  @ApiOperation({
    summary: 'Update course',
    description: 'Update data course (hanya untuk DOSEN)',
  })
  @ApiBody({
    type: UpdateCourseDto,
    description: 'Data course yang akan diupdate (semua field opsional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course berhasil diupdate',
  })
  @ApiResponse({
    status: 404,
    description: 'Course tidak ditemukan',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: AuthRequest, // 👈 Tambahkan ini
  ) {
    const userId = req.user.sub; // 👈 Ambil ID Dosen
    return this.coursesService.update(id, updateCourseDto, userId); // 👈 Lempar ke service
  }

  // DELETE /courses/:id -> HANYA Dosen
  @Delete(':id')
  @Roles('DOSEN')
  @ApiOperation({
    summary: 'Delete course',
    description: 'Menghapus course (hanya untuk DOSEN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course berhasil dihapus',
  })
  @ApiResponse({
    status: 404,
    description: 'Course tidak ditemukan',
  })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    const userId = req.user.sub;
    return this.coursesService.remove(id, userId); // 👈 Lempar ke service
  }
}
