// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    // 1. Cek apakah email ada di database
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // 2. Bandingkan password plaintext dari user dengan hash di database
    const isPasswordMatch = await bcrypt.compare(pass, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // 3. Buat payload JWT menggunakan data asli dari database
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role, // Nilainya akan otomatis 'DOSEN' atau 'MAHASISWA'
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
