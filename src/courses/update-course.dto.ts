// src/courses/dto/update-course.dto.ts
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ScheduleDto } from './create-course.dto'; // <-- Import ScheduleDto dari file sebelah

export class UpdateCourseDto {
  @ApiProperty({
    example: 'IF101',
    description: 'Kode mata kuliah (unik)',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    example: 'Pemrograman Dasar',
    description: 'Nama mata kuliah',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 3,
    description: 'Jumlah SKS (minimal 1)',
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1, { message: 'SKS minimal adalah 1' })
  @IsOptional()
  credits?: number;

  @ApiProperty({
    description: 'Jadwal mata kuliah (opsional)',
    type: [ScheduleDto],
    required: false,
    example: [
      {
        day: 'SENIN',
        startTime: '08:00',
        endTime: '09:40',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  @IsOptional() // Opsional karena dosen mungkin tidak update jadwal
  schedules?: ScheduleDto[];
}
