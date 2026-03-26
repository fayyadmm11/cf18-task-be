// src/database/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  pgEnum,
  time,
  integer,
  unique,
  boolean,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  capacity: integer('capacity').default(40).notNull(), // Kapasitas Kelas (default 40)
  isGradesPublished: boolean('is_grades_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// tipe Enum untuk Hari agar data selalu valid
export const dayEnum = pgEnum('day', [
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
  'MINGGU',
]);

// tabel Jadwal Mata Kuliah (1 Mata Kuliah bisa punya banyak baris di sini)
export const courseSchedules = pgTable('course_schedules', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  day: dayEnum('day').notNull(),

  // Tipe 'time' di PostgreSQL menyimpan format 'HH:mm:ss' (contoh: '08:00:00')
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
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

// LEVEL 4: GRADING SYSTEM TABLES
// Tabel Komponen Penilaian (Dibuat oleh Dosen)
export const courseGradingComponents = pgTable('course_grading_components', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(), // Contoh: 'UTS', 'UAS', 'Project'
  weight: integer('weight').notNull(), // Contoh: 40 (artinya 40%)
});

// Tabel Nilai Mentah Mahasiswa (Diisi oleh Dosen)
export const studentGrades = pgTable('student_grades', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  componentId: integer('component_id')
    .references(() => courseGradingComponents.id, { onDelete: 'cascade' })
    .notNull(),
  // numeric(5,2) mendukung nilai desimal maksimal 999.99 (contoh: 85.50)
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
});

export const courseGradingComponentsRelations = relations(
  courseGradingComponents,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [courseGradingComponents.courseId],
      references: [courses.id],
    }),
    grades: many(studentGrades),
  }),
);

export const studentGradesRelations = relations(studentGrades, ({ one }) => ({
  student: one(users, {
    fields: [studentGrades.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [studentGrades.courseId],
    references: [courses.id],
  }),
  component: one(courseGradingComponents, {
    fields: [studentGrades.componentId],
    references: [courseGradingComponents.id],
  }),
}));
