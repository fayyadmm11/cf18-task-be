// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

// Key ini digunakan oleh NestJS untuk menyimpan metadata di memori
export const ROLES_KEY = 'roles';

// Fungsi decorator yang menerima array of string (contoh: 'DOSEN', 'MAHASISWA')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
