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
import { ScheduleDto } from './create-course.dto'; // <-- Import ScheduleDto dari file sebelah

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(1, { message: 'SKS minimal adalah 1' })
  @IsOptional()
  credits?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  @IsOptional() // Opsional karena dosen mungkin tidak update jadwal
  schedules?: ScheduleDto[];
}
