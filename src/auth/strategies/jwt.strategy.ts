// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// 1. Definisikan bentuk asli dari Payload JWT yang kita buat di AuthService
export type JwtPayload = {
  sub: number;
  name: string;
  npm?: string;
  nip?: string;
  email: string;
  role: 'DOSEN' | 'MAHASISWA';
  iat?: number; // Issued At (Otomatis ditambahkan oleh NestJS)
  exp?: number; // Expiration (Otomatis ditambahkan oleh NestJS)
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // 2. Hapus kata kunci 'async' dan ganti tipe 'any' dengan 'JwtPayload'
  validate(payload: JwtPayload) {
    // Karena payload sudah bertipe JwtPayload, assignment ini 100% aman (Type-Safe)
    return {
      sub: payload.sub,
      name: payload.name,
      npm: payload.npm,
      nip: payload.nip,
      email: payload.email,
      role: payload.role,
    };
  }
}
