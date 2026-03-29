// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // 1. Import ConfigService
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    // 2. Gunakan registerAsync alih-alih register
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService], // 3. Suntikkan ConfigService
      useFactory: (configService: ConfigService) => ({
        // 4. Ambil secret dari .env secara dinamis
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
