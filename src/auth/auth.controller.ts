// src/auth/auth.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK) // Mengubah response default 201 (Created) menjadi 200 (OK) karena ini proses login
  @Post('login')
  async signIn(@Body() loginDto: LoginDto) {
    // Berkat class-validator, jika sampai di baris ini, data email & password pasti valid secara format
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
