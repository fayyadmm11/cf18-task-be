// src/courses/courses.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

type ValidDay =
  | 'SENIN'
  | 'SELASA'
  | 'RABU'
  | 'KAMIS'
  | 'JUMAT'
  | 'SABTU'
  | 'MINGGU';

@Injectable()
export class CoursesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // --- 1. MEMBUAT KELAS & JADWAL ---
  async create(createCourseDto: CreateCourseDto) {
    // Pisahkan schedules dari data course lainnya
    const { schedules, ...courseData } = createCourseDto;

    // Gunakan Transaction agar aman
    return await this.db.transaction(async (tx) => {
      // A. Insert ke tabel courses
      const [newCourse] = await tx
        .insert(schema.courses)
        .values(courseData)
        .returning();

      // B. Insert ke tabel course_schedules (jika ada jadwal yang diinput)
      if (schedules && schedules.length > 0) {
        const scheduleValues = schedules.map((s) => ({
          courseId: newCourse.id,
          day: s.day as ValidDay, // Type casting untuk enum Drizzle
          startTime: s.startTime,
          endTime: s.endTime,
        }));

        await tx.insert(schema.courseSchedules).values(scheduleValues);
      }

      return {
        message: 'Mata kuliah dan jadwal berhasil dibuat!',
        course: newCourse,
      };
    });
  }

  // --- 2. MENGUBAH KELAS & JADWAL (WIPE & REPLACE) ---
  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const { schedules, ...courseData } = updateCourseDto;

    return await this.db.transaction(async (tx) => {
      // A. Update data utama courses (jika ada perubahan nama/kapasitas)
      if (Object.keys(courseData).length > 0) {
        await tx
          .update(schema.courses)
          .set(courseData)
          .where(eq(schema.courses.id, id));
      }

      // B. Update jadwal menggunakan trik "Wipe & Replace"
      if (schedules) {
        // Hapus seluruh jadwal lama secara brutal dan bersih
        await tx
          .delete(schema.courseSchedules)
          .where(eq(schema.courseSchedules.courseId, id));

        // Masukkan jadwal-jadwal yang baru
        if (schedules.length > 0) {
          const scheduleValues = schedules.map((s) => ({
            courseId: id,
            day: s.day as ValidDay,
            startTime: s.startTime,
            endTime: s.endTime,
          }));
          await tx.insert(schema.courseSchedules).values(scheduleValues);
        }
      }

      return { message: `Mata kuliah ID ${id} berhasil diperbarui!` };
    });
  }

  // --- 3. MENGHAPUS KELAS ---
  async remove(id: number) {
    // Karena di schema.ts kita sudah pakai { onDelete: 'cascade' },
    // Menghapus course akan OTOMATIS menghapus seluruh jadwalnya di database!
    await this.db.delete(schema.courses).where(eq(schema.courses.id, id));
    return {
      message: `Mata kuliah ID ${id} beserta jadwalnya berhasil dihapus!`,
    };
  }

  // Service sekarang menerima 2 argumen sesuai dengan yang dikirim Controller
  async findAll(page: number, limit: number) {
    // Rumus memotong data (contoh: Halaman 2, limit 10 -> lewati 10 data pertama)
    const offset = (page - 1) * limit;

    // 1. Hitung total seluruh mata kuliah di database (untuk metadata Frontend)
    const totalQuery = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.courses);
    const totalCourses = Number(totalQuery[0].count);

    // 2. Ambil data mata kuliah yang sudah dipotong (LIMIT & OFFSET)
    const coursesWithCount = await this.db
      .select({
        id: schema.courses.id,
        code: schema.courses.code,
        name: schema.courses.name,
        credits: schema.courses.credits,
        capacity: schema.courses.capacity,
        enrolledCount: sql<number>`count(${schema.studentCourses.studentId})`,
      })
      .from(schema.courses)
      .leftJoin(
        schema.studentCourses,
        eq(schema.courses.id, schema.studentCourses.courseId),
      )
      .groupBy(schema.courses.id)
      .orderBy(schema.courses.id) // Wajib diurutkan agar data tidak acak saat pindah halaman
      .limit(limit)
      .offset(offset);

    // 3. Ambil jadwal HANYA untuk mata kuliah yang terpotong di halaman ini
    const courseIds = coursesWithCount.map((c) => c.id);
    // Menggunakan fitur bawaan Drizzle untuk membaca tipe data tabel secara otomatis
    let allSchedules: (typeof schema.courseSchedules.$inferSelect)[] = [];

    // Cegah query error jika courseIds kosong (misal database belum ada datanya)
    if (courseIds.length > 0) {
      allSchedules = await this.db
        .select()
        .from(schema.courseSchedules)
        .where(inArray(schema.courseSchedules.courseId, courseIds));
    }

    // 4. Gabungkan data mata kuliah dengan jadwalnya masing-masing
    const data = coursesWithCount.map((course) => {
      const courseSchedules = allSchedules.filter(
        (s) => s.courseId === course.id,
      );
      return {
        ...course,
        enrolledCount: Number(course.enrolledCount),
        schedules: courseSchedules,
      };
    });

    // 5. Kembalikan struktur JSON yang standar untuk fitur Infinite Scroll
    return {
      data,
      meta: {
        total: totalCourses,
        page,
        lastPage: Math.ceil(totalCourses / limit),
      },
    };
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
}
