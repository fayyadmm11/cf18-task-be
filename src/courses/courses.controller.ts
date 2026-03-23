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
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard) // Mengaktifkan pengecekan Token & Role untuk SELURUH endpoint di bawah ini
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // GET /courses -> Bisa diakses Dosen DAN Mahasiswa
  @Get()
  @Roles('DOSEN', 'MAHASISWA')
  findAll() {
    return this.coursesService.findAll();
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
}
