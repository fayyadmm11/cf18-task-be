// src/irs/dto/create-irs.dto.ts
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateIrsDto {
  @IsNotEmpty({ message: 'ID Mata Kuliah tidak boleh kosong' })
  @IsInt({ message: 'ID Mata Kuliah harus berupa angka' })
  courseId: number;
}
