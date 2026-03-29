// src/courses/courses.service.ts
import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { CreateCourseDto } from './create-course.dto';
import { UpdateCourseDto } from './update-course.dto';

type ValidDay =
  | 'SENIN'
  | 'SELASA'
  | 'RABU'
  | 'KAMIS'
  | 'JUMAT'
  | 'SABTU'
  | 'MINGGU';

// Fungsi bantuan untuk menghitung selisih menit
function calculateMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
}

@Injectable()
export class CoursesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // --- 1. MEMBUAT KELAS & JADWAL ---
  async create(createCourseDto: CreateCourseDto, userId: number) {
    // Pisahkan schedules dari data course lainnya
    const { schedules, ...courseData } = createCourseDto;

    // 👇 TAMBAHAN VALIDASI BACKEND: Tolak jika jadwal kosong/tidak dikirim
    if (!schedules || schedules.length === 0) {
      throw new BadRequestException(
        'Mata kuliah wajib memiliki minimal 1 sesi pertemuan (jadwal).',
      );
    }

    // 👇 VALIDASI SKS vs MENIT
    if (schedules && schedules.length > 0) {
      const requiredMinutes = courseData.credits * 50;
      let scheduledMinutes = 0;

      for (const s of schedules) {
        scheduledMinutes += calculateMinutes(s.startTime, s.endTime);
      }

      if (scheduledMinutes !== requiredMinutes) {
        throw new BadRequestException(
          `Validasi gagal: Total waktu jadwal (${scheduledMinutes} menit) tidak sesuai. Untuk ${courseData.credits} SKS dibutuhkan tepat ${requiredMinutes} menit.`,
        );
      }
    }

    // Gunakan Transaction agar aman
    return await this.db.transaction(async (tx) => {
      // A. Insert ke tabel courses
      const [newCourse] = await tx
        .insert(schema.courses)
        .values({
          ...courseData,
          lecturerId: userId,
        })
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
  async update(
    id: number,
    updateCourseDto: UpdateCourseDto,
    lecturerId: number,
  ) {
    const existingCourse = await this.db
      .select({ lecturerId: schema.courses.lecturerId })
      .from(schema.courses)
      .where(eq(schema.courses.id, id));

    if (existingCourse.length === 0) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    if (existingCourse[0].lecturerId !== lecturerId) {
      throw new ForbiddenException(
        'Akses Ditolak! Anda bukan pengampu mata kuliah ini.',
      );
    }

    const { schedules, ...courseData } = updateCourseDto;

    // 👇 Cegah Dosen menghapus semua jadwal saat proses Edit
    if (schedules !== undefined && schedules.length === 0) {
      throw new BadRequestException(
        'Mata kuliah tidak boleh dibiarkan tanpa jadwal. Minimal harus ada 1 sesi pertemuan.',
      );
    }

    // 👇 VALIDASI SKS vs MENIT
    if (schedules && schedules.length > 0) {
      // Kita harus mencari SKS lama dari database jika dosen tidak mengubah SKS-nya
      const targetCourse = await this.db
        .select({ credits: schema.courses.credits })
        .from(schema.courses)
        .where(eq(schema.courses.id, id));

      const currentCredits = courseData.credits || targetCourse[0].credits;
      const requiredMinutes = currentCredits * 50;
      let scheduledMinutes = 0;

      for (const s of schedules) {
        scheduledMinutes += calculateMinutes(s.startTime, s.endTime);
      }

      if (scheduledMinutes !== requiredMinutes) {
        throw new BadRequestException(
          `Validasi gagal: Total waktu jadwal (${scheduledMinutes} menit) tidak sesuai. Untuk ${currentCredits} SKS dibutuhkan tepat ${requiredMinutes} menit.`,
        );
      }
    }

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
  async remove(id: number, lecturerId: number) {
    const existingCourse = await this.db
      .select({ lecturerId: schema.courses.lecturerId })
      .from(schema.courses)
      .where(eq(schema.courses.id, id));

    if (existingCourse.length === 0) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    if (existingCourse[0].lecturerId !== lecturerId) {
      throw new ForbiddenException(
        'Akses Ditolak! Anda bukan pengampu mata kuliah ini.',
      );
    }

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
        lecturerName: schema.users.name,
      })
      .from(schema.courses)
      .leftJoin(
        schema.studentCourses,
        eq(schema.courses.id, schema.studentCourses.courseId),
      )
      .leftJoin(schema.users, eq(schema.courses.lecturerId, schema.users.id))
      .groupBy(schema.courses.id, schema.users.name)
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

  // 👇 Tambahkan fungsi ini untuk mengambil data dari Database
  async getCourseParticipants(courseId: number) {
    // 1. Cek apakah mata kuliahnya ada
    const [course] = await this.db
      .select({ name: schema.courses.name, capacity: schema.courses.capacity })
      .from(schema.courses)
      .where(eq(schema.courses.id, courseId));

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // 2. Ambil daftar mahasiswa (Gabungkan tabel Users dan Enrollments/IRS)
    // ⚠️ Sesuaikan 'schema.enrollments' dan 'schema.users' dengan file schema.ts Anda!
    const participants = await this.db
      .select({
        id: schema.users.id,
        npm: schema.users.npm, // Sesuaikan jika namanya 'nim'
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.users)
      .innerJoin(
        schema.studentCourses, // Ganti dengan tabel relasi mahasiswa-matkul Anda
        eq(schema.users.id, schema.studentCourses.studentId),
      )
      .where(eq(schema.studentCourses.courseId, courseId));

    // 3. Kirim paketnya ke React!
    return {
      courseId: courseId.toString(),
      courseName: course.name,
      capacity: course.capacity,
      enrolled: participants.length,
      students: participants,
    };
  }
}
