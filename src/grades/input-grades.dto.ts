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

export class GradeItemDto {
  @IsInt()
  studentId: number;

  @IsInt()
  componentId: number;

  @IsNumber()
  @Min(0, { message: 'Nilai minimal 0' })
  @Max(100, { message: 'Nilai maksimal 100' })
  score: number;
}

export class BatchInputGradesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeItemDto)
  grades: GradeItemDto[];
}

export class PublishGradesDto {
  @IsBoolean()
  isPublished: boolean;
}
