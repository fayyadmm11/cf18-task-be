// src/database/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  unique,
} from 'drizzle-orm/pg-core';

// role
export const roleEnum = pgEnum('role', ['DOSEN', 'MAHASISWA']);

// tabel user
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().default('Pengguna Sistem'), // Nama Lengkap
  npm: varchar('npm', { length: 20 }).unique(), // Nomor Pokok Mahasiswa (Khusus MAHASISWA)
  nip: varchar('nip', { length: 20 }).unique(), // Nomor Induk Pegawai (Khusus DOSEN)
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').default('MAHASISWA').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// tabel courses
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  credits: integer('credits').notNull(),

  // LOGIC: Kapasitas Kelas (Diberi default 40 agar data lama aman)
  capacity: integer('capacity').default(40).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// LOGIC: Tabel Jembatan (IRS) MAHASISWA & COURSES
export const studentCourses = pgTable(
  'student_courses',
  {
    id: serial('id').primaryKey(),

    // Relasi ke tabel users (Hanya untuk MAHASISWA)
    studentId: integer('student_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    // Relasi ke tabel courses
    courseId: integer('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    // PROTEKSI: Mencegah mahasiswa mengambil 1 mata kuliah yang sama lebih dari sekali
    unqEnrollment: unique('unique_enrollment').on(t.studentId, t.courseId),
  }),
);
