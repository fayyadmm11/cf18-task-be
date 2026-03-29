// src/courses/dto/input-grades.dto.ts
import {
  IsInt,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GradeItemDto {
  @ApiProperty({
    example: 1,
    description: 'ID Siswa',
    type: Number,
  })
  @IsInt()
  studentId: number;

  @ApiProperty({
    example: 2,
    description: 'ID Komponen Penilaian',
    type: Number,
  })
  @IsInt()
  componentId: number;

  @ApiProperty({
    example: 85,
    description: 'Nilai siswa (0-100)',
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0, { message: 'Nilai minimal 0' })
  @Max(100, { message: 'Nilai maksimal 100' })
  score: number;
}

export class BatchInputGradesDto {
  @ApiProperty({
    description: 'Daftar nilai siswa untuk batch input',
    type: [GradeItemDto],
    example: [
      {
        studentId: 1,
        componentId: 1,
        score: 85,
      },
      {
        studentId: 2,
        componentId: 1,
        score: 90,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeItemDto)
  grades: GradeItemDto[];
}

export class PublishGradesDto {
  @ApiProperty({
    example: true,
    description: 'Apakah nilai akan dipublikasikan kepada mahasiswa',
    type: Boolean,
  })
  @IsBoolean()
  isPublished: boolean;
}
