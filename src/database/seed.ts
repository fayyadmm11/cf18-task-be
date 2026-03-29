// src/database/seed.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';
import { fakerID_ID as faker } from '@faker-js/faker';
import 'dotenv/config';

async function main() {
  console.log('⏳ Menyiapkan mesin waktu... Memulai Mass Seeding!');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // FASE 1: BULLDOZER (HAPUS DATA LAMA)
    console.log('🚜 Menghancurkan data lama (Reverse Order)...');
    await db.delete(schema.studentGrades);
    await db.delete(schema.courseGradingComponents);
    await db.delete(schema.studentCourses);
    await db.delete(schema.courseSchedules);
    await db.delete(schema.courses);
    await db.delete(schema.users);
    console.log('✅ Database bersih kinclong!');

    // FASE 2: PABRIK DATA
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    console.log('👨‍🏫 Merekrut 10 Dosen (1 Utama, 9 Dummy)...');

    // 1a. Buat Akun Default Dosen (Bisa dipakai login)
    const [defaultDosen] = await db
      .insert(schema.users)
      .values({
        name: 'Prof. Budi Raharjo, M.Kom.',
        nip: '198001012005011001',
        email: 'dosen@siakng.com',
        password: hashedPassword,
        role: 'DOSEN',
      })
      .returning();

    // 1b. Buat 9 Dosen Dummy Menggunakan Faker
    const dummyLecturersData = Array.from({ length: 9 }).map(() => ({
      name: `${faker.person.fullName()}, M.T.`, // Tambah gelar agar realistis
      nip: faker.string.numeric(18),
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      role: 'DOSEN' as const,
    }));

    const dummyLecturers = await db
      .insert(schema.users)
      .values(dummyLecturersData)
      .returning();

    // Gabungkan semua 10 dosen ke dalam satu array
    const allLecturers = [defaultDosen, ...dummyLecturers];

    // 2. Mass Seeding Mahasiswa (Buat 30 Mahasiswa Dummy)
    // ... (KODE MAHASISWA ANDA TETAP SAMA SEPERTI SEBELUMNYA) ...
    console.log('🧑‍🎓 Mendaftarkan 30 Mahasiswa Angkatan Baru...');
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

    const allStudents = [defaultMahasiswa, ...dummyStudents];

    // 3. Buat Mata Kuliah IT & Acak Dosen Pengajarnya
    console.log('📚 Menyusun Kurikulum dan Membagi Beban Mengajar Dosen...');

    // Fungsi kecil untuk mengambil ID dosen secara acak dari 10 dosen tadi
    const getRandomLecturerId = () => {
      const randomIndex = Math.floor(Math.random() * allLecturers.length);
      return allLecturers[randomIndex].id;
    };

    const courseTemplates = [
      {
        code: 'IF101',
        name: 'Algoritma & Pemrograman Dasar',
        credits: 4,
        capacity: 40,
        lecturerId: getRandomLecturerId(), // 👈 Sekarang dosennya acak!
      },
      {
        code: 'IF202',
        name: 'Sistem Basis Data Terapan',
        credits: 3,
        capacity: 40,
        lecturerId: getRandomLecturerId(),
      },
      {
        code: 'IF303',
        name: 'Pengembangan Aplikasi Web',
        credits: 4,
        capacity: 30,
        lecturerId: getRandomLecturerId(),
      },
      {
        code: 'IF404',
        name: 'Infrastruktur DevOps & Cloud',
        credits: 3,
        capacity: 25,
        lecturerId: getRandomLecturerId(),
      },
      {
        code: 'IF505',
        name: 'Keamanan Sistem Informasi',
        credits: 3,
        capacity: 30,
        lecturerId: getRandomLecturerId(),
      },
    ];

    const createdCourses = await db
      .insert(schema.courses)
      .values(courseTemplates)
      .returning();

    // 4. Buat Jadwal, Komponen Nilai, & Mengisi Kelas (IRS)
    console.log('🗓️ Mengatur Jadwal, Komponen Penilaian, dan IRS Mahasiswa...');

    for (const course of createdCourses) {
      // A. Buat Jadwal
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
      const enrolledStudents = allStudents.filter(
        (s) => s.id === defaultMahasiswa.id || Math.random() > 0.4,
      );

      const enrollmentsData = enrolledStudents.map((student) => ({
        studentId: student.id,
        courseId: course.id,
      }));
      await db.insert(schema.studentCourses).values(enrollmentsData);

      // D. Simulasi Dosen Memberi Nilai
      type NewGrade = typeof schema.studentGrades.$inferInsert;
      const gradesData: NewGrade[] = [];
      for (const student of enrolledStudents) {
        for (const comp of components) {
          gradesData.push({
            studentId: student.id,
            courseId: course.id,
            componentId: comp.id,
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
    console.log('🚀 GUNAKAN AKUN BERIKUT UNTUK LOGIN DI FRONTEND:');
    console.log('👨‍🏫 Akun Dosen Utama     : dosen@siakng.com');
    console.log('🎓 Akun Mahasiswa Utama : mahasiswa@siakng.com');
    console.log(
      '📊 Akun Mahasiswa Lain  : cek database, bisa dengan drizzle studio, jalankan: pnpm drizzle-kit studio',
    );
    console.log('🔑 Password (Semua Akun) : password123');
  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

void main();
