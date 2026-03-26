// src/courses/courses.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq, sql, inArray, and } from 'drizzle-orm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SetGradingComponentsDto } from './dto/grading.dto';
import { BatchInputGradesDto } from './dto/input-grades.dto';

type ValidDay =
  | 'SENIN'
  | 'SELASA'
  | 'RABU'
  | 'KAMIS'
  | 'JUMAT'
  | 'SABTU'
  | 'MINGGU';

export interface RHSDetail {
  courseId: number;
  code: string;
  name: string;
  credits: number;
  isPublished: boolean;
  finalScore: number | null;
  letter: string;
  index: number;
  status: string;
}

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

  // Level 4: Grading Components
  async setGradingComponents(courseId: number, dto: SetGradingComponentsDto) {
    // 1. Validasi Total Bobot Wajib 100%
    const totalWeight = dto.components.reduce(
      (sum, comp) => sum + comp.weight,
      0,
    );
    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Total bobot harus tepat 100%. Saat ini total bobot Anda: ${totalWeight}%`,
      );
    }

    // 2. Gunakan Transaction agar aman (Wipe & Replace)
    return await this.db.transaction(async (tx) => {
      // Pastikan mata kuliahnya ada
      const course = await tx
        .select()
        .from(schema.courses)
        .where(eq(schema.courses.id, courseId));
      if (course.length === 0)
        throw new NotFoundException('Mata kuliah tidak ditemukan');

      // Hapus seluruh komponen lama (jika ada)
      await tx
        .delete(schema.courseGradingComponents)
        .where(eq(schema.courseGradingComponents.courseId, courseId));

      // Masukkan komponen baru
      const insertData = dto.components.map((c) => ({
        courseId,
        name: c.name,
        weight: c.weight,
      }));

      await tx.insert(schema.courseGradingComponents).values(insertData);

      return {
        message: 'Komposisi nilai berhasil disimpan!',
        totalWeight,
      };
    });
  }

  // Fungsi tambahan untuk mengambil komponen yang sudah dibuat
  async getGradingComponents(courseId: number) {
    return await this.db
      .select()
      .from(schema.courseGradingComponents)
      .where(eq(schema.courseGradingComponents.courseId, courseId));
  }

  // LEVEL 4: INPUT NILAI & PUBLIKASI
  // 1. Dosen Memasukkan Nilai
  async inputStudentGrades(courseId: number, dto: BatchInputGradesDto) {
    return await this.db.transaction(async (tx) => {
      // Untuk menghindari duplikasi (Data Integrity), kita hapus dulu nilai lama
      // untuk mahasiswa dan komponen yang bersangkutan, lalu kita masukkan yang baru.
      for (const grade of dto.grades) {
        await tx
          .delete(schema.studentGrades)
          .where(
            and(
              eq(schema.studentGrades.studentId, grade.studentId),
              eq(schema.studentGrades.componentId, grade.componentId),
            ),
          );

        await tx.insert(schema.studentGrades).values({
          courseId,
          studentId: grade.studentId,
          componentId: grade.componentId,
          score: grade.score.toString(), // Drizzle numeric butuh string agar presisi desimalnya aman
        });
      }

      return { message: `${dto.grades.length} data nilai berhasil disimpan!` };
    });
  }

  // 2. Dosen Mengatur Status Publikasi Nilai
  async toggleGradePublication(courseId: number, isPublished: boolean) {
    const [updatedCourse] = await this.db
      .update(schema.courses)
      .set({ isGradesPublished: isPublished })
      .where(eq(schema.courses.id, courseId))
      .returning();

    if (!updatedCourse)
      throw new NotFoundException('Mata kuliah tidak ditemukan');

    const status = isPublished ? 'DIPUBLIKASIKAN' : 'DISEMBUNYIKAN';
    return {
      message: `Nilai mata kuliah ${updatedCourse.name} sekarang ${status} dari mahasiswa.`,
    };
  }

  // ==========================================
  // HELPER: KONVERSI NILAI PRESISI (SESUAI GAMBAR)
  // ==========================================
  private getGradeInfo(finalScore: number) {
    // Sesuai dengan tabel range Min - Max
    if (finalScore >= 85) return { letter: 'A', index: 4.0 };
    if (finalScore >= 80) return { letter: 'A-', index: 3.7 }; // Asumsi indeks standar
    if (finalScore >= 75) return { letter: 'B+', index: 3.3 };
    if (finalScore >= 70) return { letter: 'B', index: 3.0 };
    if (finalScore >= 65) return { letter: 'B-', index: 2.7 };
    if (finalScore >= 60) return { letter: 'C+', index: 2.3 };
    if (finalScore >= 55) return { letter: 'C', index: 2.0 };
    if (finalScore >= 40) return { letter: 'D', index: 1.0 };
    return { letter: 'E', index: 0.0 };
  }

  // ==========================================
  // TAMBAHAN: MENGAMBIL NILAI YANG SUDAH DIINPUT DOSEN
  // ==========================================
  async getCourseGrades(courseId: number) {
    return await this.db
      .select({
        studentId: schema.studentGrades.studentId,
        componentId: schema.studentGrades.componentId,
        score: schema.studentGrades.score,
      })
      .from(schema.studentGrades)
      .where(eq(schema.studentGrades.courseId, courseId));
  }

  // ==========================================
  // LEVEL 4: KALKULASI RHS & IP SEMESTER MAHASISWA
  // ==========================================
  async getStudentRHS(studentId: number) {
    // 1. Tarik mata kuliah yang diambil
    const enrolledCourses = await this.db
      .select({
        courseId: schema.courses.id,
        code: schema.courses.code,
        name: schema.courses.name,
        credits: schema.courses.credits,
        isPublished: schema.courses.isGradesPublished,
      })
      .from(schema.studentCourses)
      .innerJoin(
        schema.courses,
        eq(schema.studentCourses.courseId, schema.courses.id),
      )
      .where(eq(schema.studentCourses.studentId, studentId));

    // 2. Tarik nilai mentah
    const studentScores = await this.db
      .select({
        courseId: schema.studentGrades.courseId,
        weight: schema.courseGradingComponents.weight,
        score: schema.studentGrades.score,
      })
      .from(schema.studentGrades)
      .innerJoin(
        schema.courseGradingComponents,
        eq(schema.studentGrades.componentId, schema.courseGradingComponents.id),
      )
      .where(eq(schema.studentGrades.studentId, studentId));

    let totalSks = 0;
    let totalBobotSks = 0;

    const rhsDetails: RHSDetail[] = [];

    // 3. Kalkulasi per Matkul
    for (const course of enrolledCourses) {
      // Kita cek apakah dosen sudah memasukkan nilai untuk mahasiswa ini di matkul ini
      const courseScores = studentScores.filter(
        (s) => s.courseId === course.courseId,
      );
      const hasGrades = courseScores.length > 0;

      if (!course.isPublished) {
        // Jika belum rilis, tentukan status spesifiknya (Belum dinilai vs Menunggu Publikasi)
        const statusText = hasGrades ? 'Menunggu Publikasi' : 'Belum Dinilai';

        rhsDetails.push({
          ...course,
          finalScore: null,
          letter: '-',
          index: 0.0,
          status: statusText, // 👈 Status cerdas dimasukkan ke sini
        });
        continue; // Lanjut ke matkul berikutnya (SKS tidak dihitung ke IP)
      }

      // --- JIKA DOSEN SUDAH KLIK PUBLISH ---
      let finalScore = 0;
      courseScores.forEach((s) => {
        finalScore += (Number(s.score) * s.weight) / 100;
      });

      const { letter, index } = this.getGradeInfo(finalScore);

      rhsDetails.push({
        ...course,
        finalScore: parseFloat(finalScore.toFixed(2)),
        letter,
        index,
        status: 'Rilis',
      });

      // SKS dan Bobot IP hanya bertambah jika statusnya 'Rilis'
      totalSks += course.credits;
      totalBobotSks += course.credits * index;
    }

    // 4. Finalisasi IP Semester
    const ipSemester =
      totalSks > 0 ? (totalBobotSks / totalSks).toFixed(2) : '0.00';

    return {
      studentId,
      ipSemester: parseFloat(ipSemester),
      totalSksEvaluated: totalSks,
      details: rhsDetails,
    };
  }
}
