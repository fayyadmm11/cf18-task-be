// src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global() // Menjadikan modul ini global agar tidak perlu di-import berulang kali di modul lain
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService], // Mengambil ConfigService untuk membaca .env
      useFactory: (configService: ConfigService) => {
        // Mengambil URL dari .env
        const connectionString = configService.get<string>('DATABASE_URL');

        // Membuka koneksi pool ke PostgreSQL
        const pool = new Pool({ connectionString });

        // Membungkus koneksi tersebut dengan Drizzle ORM beserta skemanya
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION], // Mengekspor koneksi agar bisa dipinjam oleh UsersService
})
export class DatabaseModule {}
