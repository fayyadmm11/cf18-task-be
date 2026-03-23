// src/database/seed.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';
import 'dotenv/config'; // Membaca .env

async function main() {
  console.log('⏳ Memulai proses seeding database...');

  // Buka koneksi langsung ke PostgreSQL menggunakan URL dari .env
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Hash password yang akan digunakan untuk akun default
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    console.log('Menyuntikkan data Dosen dan Mahasiswa...');

    // Masukkan data ke tabel users.
    // onConflictDoNothing() mencegah error jika skrip ini dijalankan dua kali (karena email bersifat UNIQUE)
    await db
      .insert(schema.users)
      .values([
        {
          email: 'dosen@siakng.com',
          password: hashedPassword,
          role: 'DOSEN',
        },
        {
          email: 'mahasiswa@siakng.com',
          password: hashedPassword,
          role: 'MAHASISWA',
        },
      ])
      .onConflictDoNothing();

    console.log('✅ Seeding berhasil! Akun default telah dibuat.');
  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
  } finally {
    // Pastikan untuk menutup koneksi pool agar terminal tidak menggantung
    await pool.end();
    process.exit(0);
  }
}

main();
