// src/courses/courses.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // READ: Diperbolehkan untuk semua (Dosen & Mahasiswa)
  async findAll() {
    return await this.db.select().from(schema.courses);
  }

  // CREATE: Hanya Dosen
  async create(createCourseDto: CreateCourseDto) {
    const newCourse = await this.db
      .insert(schema.courses)
      .values(createCourseDto)
      .returning(); // Mengembalikan data yang baru saja dimasukkan

    return newCourse[0];
  }

  // PATCH: Hanya Dosen
  async update(id: number, updateCourseDto: UpdateCourseDto) {
    // Memperbarui data yang spesifik di-passing melalui DTO
    const updatedCourse = await this.db
      .update(schema.courses)
      .set(updateCourseDto)
      .where(eq(schema.courses.id, id))
      .returning();

    if (updatedCourse.length === 0) {
      throw new NotFoundException(
        `Mata kuliah dengan ID ${id} tidak ditemukan`,
      );
    }

    return {
      message: 'Mata kuliah berhasil diperbarui',
      course: updatedCourse[0],
    };
  }

  // DELETE: Hanya Dosen
  async remove(id: number) {
    const deletedCourse = await this.db
      .delete(schema.courses)
      .where(eq(schema.courses.id, id))
      .returning();

    if (deletedCourse.length === 0) {
      throw new NotFoundException(
        `Mata kuliah dengan ID ${id} tidak ditemukan`,
      );
    }

    return {
      message: 'Mata kuliah berhasil dihapus',
      course: deletedCourse[0],
    };
  }
}
