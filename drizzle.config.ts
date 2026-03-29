// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle', // Folder ini akan otomatis terbuat untuk menyimpan riwayat migrasi
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Tanda '!' memberi tahu TypeScript bahwa nilai ini pasti ada
  },
});
