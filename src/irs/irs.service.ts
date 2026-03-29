// src/irs/irs.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql, inArray } from 'drizzle-orm';
import * as schema from '../database/schema'; // Sesuaikan path dengan lokasi schema.ts Anda

@Injectable()
export class IrsService {
  constructor(
    @Inject('DATABASE_CONNECTION') // Sesuaikan dengan nama token provider database Anda
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==========================================
  // FITUR 1: MENGAMBIL MATA KULIAH (Data Integrity Level 4)
  // ==========================================
  async takeCourse(studentId: number, courseId: number) {
    // 👇 BUNGKUS SEMUANYA DENGAN TRANSACTION (tx)
    return await this.db.transaction(async (tx) => {
      // 1. Cari data mata kuliah (Gunakan tx, bukan this.db)
      const targetCourseArray = await tx
        .select()
        .from(schema.courses)
        .where(eq(schema.courses.id, courseId))
        .for('update');

      if (targetCourseArray.length === 0) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }
      const targetCourse = targetCourseArray[0];

      // 2. Cek apakah mahasiswa SUDAH mengambil mata kuliah ini sebelumnya
      const existingEnrollment = await tx
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

      // 3. Cek Batas Maksimal SKS (24 SKS)
      const enrolledCourses = await tx
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

      // LOGIC Cek Jadwal Bentrok
      const targetSchedules = await tx
        .select()
        .from(schema.courseSchedules)
        .where(eq(schema.courseSchedules.courseId, courseId));

      if (targetSchedules.length > 0) {
        const takenCoursesSchedules = await tx
          .select({
            courseName: schema.courses.name,
            day: schema.courseSchedules.day,
            startTime: schema.courseSchedules.startTime,
            endTime: schema.courseSchedules.endTime,
          })
          .from(schema.studentCourses)
          .innerJoin(
            schema.courses,
            eq(schema.studentCourses.courseId, schema.courses.id),
          )
          .innerJoin(
            schema.courseSchedules,
            eq(schema.courses.id, schema.courseSchedules.courseId),
          )
          .where(eq(schema.studentCourses.studentId, studentId));

        for (const target of targetSchedules) {
          for (const taken of takenCoursesSchedules) {
            if (target.day === taken.day) {
              const isOverlap =
                target.startTime < taken.endTime &&
                target.endTime > taken.startTime;
              if (isOverlap) {
                throw new BadRequestException(
                  `Gagal mengambil mata kuliah! Jadwal bentrok dengan mata kuliah ${taken.courseName} pada hari ${target.day} (${target.startTime} - ${target.endTime}).`,
                );
              }
            }
          }
        }
      }

      // ==========================================
      // 4. DATA INTEGRITY: Cek Kuota Aman (Tanpa Menyusutkan Kapasitas)
      // ==========================================
      // Kunci data mata kuliah ini secara absolut selama transaksi berjalan (Mencegah Race Condition)
      // Pastikan Anda sudah meletakkan ini di langkah 1 pencarian targetCourse!
      /* const targetCourseArray = await tx.select().from(schema.courses)
           .where(eq(schema.courses.id, courseId)).for('update'); // <-- Kunci penting
      */

      // Hitung secara akurat berapa mahasiswa yang sudah terdaftar di tabel student_courses
      const enrolledQuery = await tx
        .select({ count: sql<number>`count(*)` })
        .from(schema.studentCourses)
        .where(eq(schema.studentCourses.courseId, courseId));

      const currentEnrolled = Number(enrolledQuery[0].count);

      // Validasi: Jika jumlah mahasiswa sudah mencapai/melebihi batas maksimal ruangan
      if (currentEnrolled >= targetCourse.capacity) {
        throw new BadRequestException(
          'Gagal mengambil kelas! Kuota kelas penuh atau baru saja habis direbut mahasiswa lain.',
        );
      }

      // ==========================================
      // 5. EKSEKUSI: Masukkan data ke tabel (Gunakan tx)
      // ==========================================
      await tx.insert(schema.studentCourses).values({
        studentId,
        courseId,
      });

      return {
        message: 'Berhasil mengambil mata kuliah',
        course: targetCourse.name,
        currentSks: newTotalSks,
      };
    }); // <-- Akhir dari kapsul Transaction
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
    // 1. Ambil data kelas beserta NAMA DOSEN (Join dengan tabel users)
    const enrolledCoursesRaw = await this.db
      .select({
        id: schema.courses.id,
        code: schema.courses.code,
        name: schema.courses.name,
        credits: schema.courses.credits,
        lecturerName: schema.users.name, // 👈 TAMBAHAN: Ambil nama dosen
      })
      .from(schema.studentCourses)
      .innerJoin(
        schema.courses,
        eq(schema.studentCourses.courseId, schema.courses.id),
      )
      .leftJoin(
        // 👈 TAMBAHAN: Join tabel users untuk mencocokkan ID Dosen
        schema.users,
        eq(schema.courses.lecturerId, schema.users.id),
      )
      .where(eq(schema.studentCourses.studentId, studentId));

    // Kalkulasi total SKS
    const totalSks = enrolledCoursesRaw.reduce(
      (sum, course) => sum + course.credits,
      0,
    );

    // 2. Ambil Jadwal untuk kelas-kelas yang diambil mahasiswa ini
    const courseIds = enrolledCoursesRaw.map((c) => c.id);
    let allSchedules: (typeof schema.courseSchedules.$inferSelect)[] = [];

    // Jika mahasiswa punya kelas, tarik jadwal dari database
    if (courseIds.length > 0) {
      allSchedules = await this.db
        .select()
        .from(schema.courseSchedules)
        .where(inArray(schema.courseSchedules.courseId, courseIds)); // 👈 Membutuhkan import inArray
    }

    // 3. Gabungkan Kelas dengan Jadwalnya masing-masing
    const enrolledCourses = enrolledCoursesRaw.map((course) => {
      const courseSchedules = allSchedules.filter(
        (s) => s.courseId === course.id,
      );
      return {
        ...course,
        schedules: courseSchedules, // 👈 TAMBAHAN: Sisipkan jadwal ke dalam data kelas
      };
    });

    return {
      totalSks: totalSks,
      enrolledCourses: enrolledCourses, // Data ini sekarang sudah lengkap dengan Dosen & Jadwal!
    };
  }

  // ==========================================
  // FITUR 4: MELIHAT DAFTAR PESERTA KELAS (Khusus Dosen)
  // ==========================================
  async getCourseStudents(courseId: number) {
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
      isGradesPublished: targetCourseArray[0].isGradesPublished,
      students: students,
    };
  }
}
