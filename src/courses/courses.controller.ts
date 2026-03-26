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
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SetGradingComponentsDto } from './dto/grading.dto';
import { BatchInputGradesDto, PublishGradesDto } from './dto/input-grades.dto';

// Kontrak tipe data agar TypeScript tahu persis isi dari Token JWT
export interface AuthRequest {
  user: {
    sub: number;
    name: string;
    email: string;
    role: string;
  };
}

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard) // Mengaktifkan pengecekan Token & Role untuk SELURUH endpoint di bawah ini
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // GET /courses -> Sekarang mendukung Pagination (?page=X&limit=Y)
  @Get()
  @Roles('DOSEN', 'MAHASISWA')
  findAll(
    @Query('page') page: string = '1', // Jika tidak dikirim, otomatis halaman 1
    @Query('limit') limit: string = '10', // Jika tidak dikirim, otomatis 10 data per halaman
  ) {
    // Ubah string dari URL menjadi angka murni
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Kirim 2 argumen ini ke Service
    return this.coursesService.findAll(pageNumber, limitNumber);
  }

  // GET /courses/:id/students -> HANYA Dosen (Lihat daftar mahasiswa di kelas)
  @Get(':id/students')
  @Roles('DOSEN')
  getCourseStudents(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getStudentsByCourse(id);
  }

  // POST /courses -> HANYA Dosen
  @Post()
  @Roles('DOSEN')
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
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

  // LEVEL 4 ENDPOINTS
  // GET /courses/:id/components -> Melihat komponen penilaian (Dosen & Mahasiswa boleh lihat)
  @Get(':id/components')
  @Roles('DOSEN', 'MAHASISWA')
  getGradingComponents(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getGradingComponents(id);
  }

  // PUT /courses/:id/components -> Dosen mengatur komponen penilaian
  @Patch(':id/components') // Memakai PATCH atau PUT sama saja, kita pakai PATCH
  @Roles('DOSEN')
  setGradingComponents(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetGradingComponentsDto,
  ) {
    return this.coursesService.setGradingComponents(id, dto);
  }

  // LEVEL 4: ENDPOINT INPUT NILAI & PUBLIKASI
  // GET /courses/:id/grades -> Dosen mengambil data nilai yang sudah ada
  @Get(':id/grades')
  @Roles('DOSEN')
  getCourseGrades(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getCourseGrades(id);
  }

  // POST /courses/:id/grades -> Dosen memasukkan nilai mahasiswa
  @Post(':id/grades')
  @Roles('DOSEN')
  inputGrades(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BatchInputGradesDto,
  ) {
    return this.coursesService.inputStudentGrades(id, dto);
  }

  // PATCH /courses/:id/publish -> Dosen mem-publish / unpublish nilai
  @Patch(':id/publish')
  @Roles('DOSEN')
  togglePublication(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishGradesDto,
  ) {
    return this.coursesService.toggleGradePublication(id, dto.isPublished);
  }

  @Get('my/rhs')
  @Roles('MAHASISWA')
  getMyRHS(@Req() req: AuthRequest) {
    const studentId = Number(req.user.sub);
    return this.coursesService.getStudentRHS(studentId);
  }
}
