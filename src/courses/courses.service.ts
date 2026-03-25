// src/courses/courses.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
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
    // Lakukan query agregasi langsung di level Database
    const result = await this.db
      .select({
        id: schema.courses.id,
        code: schema.courses.code,
        name: schema.courses.name,
        credits: schema.courses.credits,
        capacity: schema.courses.capacity,
        // Drizzle menghitung baris yang cocok di tabel studentCourses
        enrolledCount: sql<number>`count(${schema.studentCourses.studentId})`,
      })
      .from(schema.courses)
      .leftJoin(
        schema.studentCourses,
        eq(schema.courses.id, schema.studentCourses.courseId),
      )
      .groupBy(schema.courses.id);

    // Casting enrolledCount menjadi number dengan aman (karena PostgreSQL sering mengembalikan count sebagai string)
    return result.map((course) => ({
      ...course,
      enrolledCount: Number(course.enrolledCount),
    }));
  }

  // GET students from each course: Hanya Dosen
  async getStudentsByCourse(courseId: number) {
    // 1. Cek apakah mata kuliahnya ada
    const targetCourseArray = await this.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, courseId));

    if (targetCourseArray.length === 0) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // 2. Lakukan JOIN untuk mengambil data mahasiswa dari tabel jembatan
    const students = await this.db
      .select({
        id: schema.users.id,
        npm: schema.users.npm,
        name: schema.users.name,
        email: schema.users.email,
        enrolledAt: schema.studentCourses.createdAt,
      })
      .from(schema.studentCourses)
      .innerJoin(
        schema.users,
        eq(schema.studentCourses.studentId, schema.users.id),
      )
      .where(eq(schema.studentCourses.courseId, courseId));

    // 3. Kembalikan data dengan struktur yang rapi
    return {
      courseName: targetCourseArray[0].name,
      capacity: targetCourseArray[0].capacity,
      totalEnrolled: students.length,
      students: students,
    };
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
