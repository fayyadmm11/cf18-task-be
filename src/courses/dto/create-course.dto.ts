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
  @IsEnum(DayEnum, {
    message: 'Hari tidak valid. Gunakan huruf kapital (contoh: SENIN)',
  })
  day: DayEnum;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Format jam mulai harus HH:mm (contoh: 08:00)',
  })
  startTime: string;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Format jam selesai harus HH:mm (contoh: 09:40)',
  })
  endTime: string;
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode mata kuliah tidak boleh kosong' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama mata kuliah tidak boleh kosong' })
  name: string;

  @IsInt()
  @Min(1, { message: 'SKS minimal adalah 1' })
  credits: number;

  @IsInt()
  capacity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto) // Wajib pakai class-transformer agar validasi nested berjalan
  schedules: ScheduleDto[];
}
