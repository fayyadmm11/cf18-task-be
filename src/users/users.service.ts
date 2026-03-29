// src/users/users.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm'; // Fungsi Drizzle untuk operasi "sama dengan" (WHERE email = '...')

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1); // Kita hanya butuh 1 user

    return result[0] || null; // Kembalikan user jika ada, atau null jika tidak ditemukan
  }
}
