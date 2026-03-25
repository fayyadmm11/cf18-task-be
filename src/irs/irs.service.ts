// src/irs/irs.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../database/schema'; // Sesuaikan path dengan lokasi schema.ts Anda

@Injectable()
export class IrsService {
  constructor(
    @Inject('DATABASE_CONNECTION') // Sesuaikan dengan nama token provider database Anda
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==========================================
  // FITUR 1: MENGAMBIL MATA KULIAH (Logika Bisnis 3.1 & 3.2)
  // ==========================================
  async takeCourse(studentId: number, courseId: number) {
    // 1. Cari data mata kuliah yang mau diambil
    const targetCourseArray = await this.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, courseId));

    if (targetCourseArray.length === 0) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }
    const targetCourse = targetCourseArray[0];

    // 2. Cek apakah mahasiswa SUDAH mengambil mata kuliah ini sebelumnya
    const existingEnrollment = await this.db
      .select()
      .from(schema.studentCourses)
      .where(
        and(
          eq(schema.studentCourses.studentId, studentId),
          eq(schema.studentCourses.courseId, courseId),
        ),
      );

    if (existingEnrollment.length > 0) {
      throw new BadRequestException('Anda sudah mengambil mata kuliah ini');
    }

    // 3. LOGIKA 3.1: Cek Batas Maksimal SKS (24 SKS)
    // Hitung SKS dari mata kuliah yang SUDAH diambil saat ini
    const enrolledCourses = await this.db
      .select({ credits: schema.courses.credits })
      .from(schema.studentCourses)
      .innerJoin(
        schema.courses,
        eq(schema.studentCourses.courseId, schema.courses.id),
      )
      .where(eq(schema.studentCourses.studentId, studentId));

    const currentTotalSks = enrolledCourses.reduce(
      (sum, course) => sum + course.credits,
      0,
    );
    const newTotalSks = currentTotalSks + targetCourse.credits;

    if (newTotalSks > 24) {
      throw new BadRequestException(
        `Gagal mengambil mata kuliah. Total SKS Anda akan menjadi ${newTotalSks} (Maksimal 24 SKS).`,
      );
    }

    // 4. LOGIKA 3.2: Cek Kuota / Kapasitas Kelas
    // Hitung berapa mahasiswa yang sudah ada di kelas ini
    const enrolledStudentsQuery = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.studentCourses)
      .where(eq(schema.studentCourses.courseId, courseId));

    const currentEnrolledStudents = Number(enrolledStudentsQuery[0].count);

    if (currentEnrolledStudents >= targetCourse.capacity) {
      throw new BadRequestException(
        'Gagal mengambil mata kuliah. Kelas sudah penuh!',
      );
    }

    // 5. EKSEKUSI: Jika semua lolos (SKS aman, Kuota aman), masukkan ke database!
    await this.db.insert(schema.studentCourses).values({
      studentId,
      courseId,
    });

    return {
      message: 'Berhasil mengambil mata kuliah',
      course: targetCourse.name,
      currentSks: newTotalSks,
    };
  }

  // ==========================================
  // FITUR 2: MELEPAS MATA KULIAH
  // ==========================================
  async dropCourse(studentId: number, courseId: number) {
    // Hapus data dari tabel jembatan yang cocok dengan ID Mahasiswa dan ID Mata Kuliah
    const deletedRecord = await this.db
      .delete(schema.studentCourses)
      .where(
        and(
          eq(schema.studentCourses.studentId, studentId),
          eq(schema.studentCourses.courseId, courseId),
        ),
      )
      .returning(); // Mengembalikan data yang dihapus untuk dicek

    // Jika array kosong, berarti data tidak ada di database (Mahasiswa belum ambil kelas ini)
    if (deletedRecord.length === 0) {
      throw new NotFoundException(
        'Anda tidak sedang mengambil mata kuliah ini',
      );
    }

    return { message: 'Berhasil melepas mata kuliah' };
  }

  // ==========================================
  // FITUR 3: MELIHAT STATUS IRS MAHASISWA SAAT INI
  // ==========================================
  async getStudentIrs(studentId: number) {
    const enrolledCourses = await this.db
      .select({
        id: schema.courses.id,
        code: schema.courses.code,
        name: schema.courses.name,
        credits: schema.courses.credits,
      })
      .from(schema.studentCourses)
      .innerJoin(
        schema.courses,
        eq(schema.studentCourses.courseId, schema.courses.id),
      )
      .where(eq(schema.studentCourses.studentId, studentId));

    // Kalkulasi total SKS dengan aman
    const totalSks = enrolledCourses.reduce(
      (sum, course) => sum + course.credits,
      0,
    );

    return {
      totalSks: totalSks,
      enrolledCourses: enrolledCourses,
    };
  }
}
