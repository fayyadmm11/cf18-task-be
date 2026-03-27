// src/database/seed.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';
import { fakerID_ID as faker } from '@faker-js/faker'; // Menggunakan nama lokal Indonesia
import 'dotenv/config';

async function main() {
  console.log('⏳ Menyiapkan mesin waktu... Memulai Mass Seeding!');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // ==========================================
    // FASE 1: BULLDOZER (HAPUS DATA LAMA)
    // ==========================================
    console.log('🚜 Menghancurkan data lama (Reverse Order)...');
    await db.delete(schema.studentGrades);
    await db.delete(schema.courseGradingComponents);
    await db.delete(schema.studentCourses);
    await db.delete(schema.courseSchedules);
    await db.delete(schema.courses);
    await db.delete(schema.users);
    console.log('✅ Database bersih kinclong!');

    // ==========================================
    // FASE 2: PABRIK DATA
    // ==========================================
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    console.log('👨‍🏫 Menciptakan Dosen & Mahasiswa Utama...');

    // 1. Buat Akun Default (Agar Anda tetap bisa login)
    await db.insert(schema.users).values({
      name: 'Prof. Budi Raharjo, M.Kom.',
      nip: '198001012005011001',
      email: 'dosen@siakng.com',
      password: hashedPassword,
      role: 'DOSEN',
    });

    const [defaultMahasiswa] = await db
      .insert(schema.users)
      .values({
        name: 'Andi Mahasiswa Utama',
        npm: '2400000001',
        email: 'mahasiswa@siakng.com',
        password: hashedPassword,
        role: 'MAHASISWA',
      })
      .returning();

    // 2. Mass Seeding Mahasiswa (Buat 30 Mahasiswa Dummy)
    console.log('🧑‍🎓 Mendaftarkan 30 Mahasiswa Angkatan Baru...');
    const dummyStudentsData = Array.from({ length: 30 }).map(() => ({
      name: faker.person.fullName(),
      npm: faker.string.numeric(10),
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      role: 'MAHASISWA' as const,
    }));
    const dummyStudents = await db
      .insert(schema.users)
      .values(dummyStudentsData)
      .returning();

    // Gabungkan default mahasiswa ke dalam array untuk diikutkan kelas nanti
    const allStudents = [defaultMahasiswa, ...dummyStudents];

    // 3. Buat Mata Kuliah IT
    console.log('📚 Menyusun Kurikulum Mata Kuliah IT...');
    const courseTemplates = [
      {
        code: 'IF101',
        name: 'Algoritma & Pemrograman Dasar',
        credits: 4,
        capacity: 40,
      },
      {
        code: 'IF202',
        name: 'Sistem Basis Data Terapan',
        credits: 3,
        capacity: 40,
      },
      {
        code: 'IF303',
        name: 'Pengembangan Aplikasi Web',
        credits: 4,
        capacity: 30,
      },
      {
        code: 'IF404',
        name: 'Infrastruktur DevOps & Cloud',
        credits: 3,
        capacity: 25,
      },
      {
        code: 'IF505',
        name: 'Keamanan Sistem Informasi',
        credits: 3,
        capacity: 30,
      },
    ];
    const createdCourses = await db
      .insert(schema.courses)
      .values(courseTemplates)
      .returning();

    // 4. Buat Jadwal, Komponen Nilai, & Mengisi Kelas (IRS)
    console.log('🗓️ Mengatur Jadwal, Komponen Penilaian, dan IRS Mahasiswa...');

    for (const course of createdCourses) {
      // A. Buat Jadwal (1-2 kali seminggu per matkul)
      const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'] as const;
      await db.insert(schema.courseSchedules).values({
        courseId: course.id,
        day: days[Math.floor(Math.random() * days.length)],
        startTime: '08:00:00',
        endTime: '10:30:00',
      });

      // B. Buat Komponen Penilaian Standar
      const components = await db
        .insert(schema.courseGradingComponents)
        .values([
          { courseId: course.id, name: 'Kehadiran & Tugas', weight: 20 },
          { courseId: course.id, name: 'Ujian Tengah Semester', weight: 35 },
          { courseId: course.id, name: 'Ujian Akhir Semester', weight: 45 },
        ])
        .returning();

      // C. Daftarkan Mahasiswa ke Kelas Ini (IRS)
      // Paksa Default Mahasiswa masuk ke SEMUA kelas, lalu acak mahasiswa lain
      const enrolledStudents = allStudents.filter(
        (s) => s.id === defaultMahasiswa.id || Math.random() > 0.4,
      );

      const enrollmentsData = enrolledStudents.map((student) => ({
        studentId: student.id,
        courseId: course.id,
      }));
      await db.insert(schema.studentCourses).values(enrollmentsData);

      // D. Simulasi Dosen Memberi Nilai
      // (Beri nilai acak untuk setiap mahasiswa yang ikut matkul ini di setiap komponen)
      const gradesData: any[] = [];
      for (const student of enrolledStudents) {
        for (const comp of components) {
          gradesData.push({
            studentId: student.id,
            courseId: course.id,
            componentId: comp.id,
            // Generate nilai acak antara 50.00 s/d 100.00
            score: (Math.random() * 50 + 50).toFixed(2),
          });
        }
      }
      if (gradesData.length > 0) {
        await db.insert(schema.studentGrades).values(gradesData);
      }
    }

    console.log(
      '🎉 MASS SEEDING SUKSES! Sistem kini berisi data yang sangat padat.',
    );
  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
