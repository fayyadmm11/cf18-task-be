// src/courses/dto/create-course.dto.ts
import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

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
}
