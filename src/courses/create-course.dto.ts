// src/courses/dto/create-course.dto.ts
import {
  IsString,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  Matches,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

enum DayEnum {
  SENIN = 'SENIN',
  SELASA = 'SELASA',
  RABU = 'RABU',
  KAMIS = 'KAMIS',
  JUMAT = 'JUMAT',
  SABTU = 'SABTU',
  MINGGU = 'MINGGU',
}

export class ScheduleDto {
  @ApiProperty({
    enum: DayEnum,
    example: 'SENIN',
    description: 'Hari dalam seminggu',
  })
  @IsEnum(DayEnum, {
    message: 'Hari tidak valid. Gunakan huruf kapital (contoh: SENIN)',
  })
  day: DayEnum;

  @ApiProperty({
    example: '08:00',
    description: 'Jam mulai kelas (format HH:mm)',
    type: String,
  })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Format jam mulai harus HH:mm (contoh: 08:00)',
  })
  startTime: string;

  @ApiProperty({
    example: '09:40',
    description: 'Jam selesai kelas (format HH:mm)',
    type: String,
  })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Format jam selesai harus HH:mm (contoh: 09:40)',
  })
  endTime: string;
}

export class CreateCourseDto {
  @ApiProperty({
    example: 'IF101',
    description: 'Kode mata kuliah (unik)',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Kode mata kuliah tidak boleh kosong' })
  code: string;

  @ApiProperty({
    example: 'Pemrograman Dasar',
    description: 'Nama mata kuliah',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nama mata kuliah tidak boleh kosong' })
  name: string;

  @ApiProperty({
    example: 3,
    description: 'Jumlah SKS (minimal 1)',
    type: Number,
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: 'SKS minimal adalah 1' })
  credits: number;

  @ApiProperty({
    example: 30,
    description: 'Kapasitas maksimal peserta didik',
    type: Number,
  })
  @IsInt()
  capacity: number;

  @ApiProperty({
    description: 'Jadwal mata kuliah (hari dan jam)',
    type: [ScheduleDto],
    example: [
      {
        day: 'SENIN',
        startTime: '08:00',
        endTime: '09:40',
      },
      {
        day: 'RABU',
        startTime: '10:00',
        endTime: '11:40',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto) // Wajib pakai class-transformer agar validasi nested berjalan
  schedules: ScheduleDto[];
}
