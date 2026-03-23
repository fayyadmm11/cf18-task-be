// src/courses/dto/update-course.dto.ts
import { IsString, IsInt, Min, IsOptional } from 'class-validator';

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
}
