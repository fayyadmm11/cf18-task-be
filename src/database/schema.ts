// src/database/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';

// 2 role
export const roleEnum = pgEnum('role', ['DOSEN', 'MAHASISWA']);

// tabel user
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').default('MAHASISWA').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// tabel courses
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(), // Kode course/matkul
  name: varchar('name', { length: 255 }).notNull(), // Nama course/matkul
  credits: integer('credits').notNull(), // Jumlah SKS
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
