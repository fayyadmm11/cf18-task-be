// src/courses/dto/grading.dto.ts
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GradingComponentDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama komponen tidak boleh kosong (contoh: UTS)' })
  name: string;

  @IsInt()
  @Min(1, { message: 'Bobot minimal adalah 1%' })
  @Max(100, { message: 'Bobot maksimal adalah 100%' })
  weight: number;
}

export class SetGradingComponentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Minimal harus ada 1 komponen penilaian' })
  @Type(() => GradingComponentDto)
  components: GradingComponentDto[];
}
