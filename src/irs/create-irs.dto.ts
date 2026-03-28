// src/irs/dto/create-irs.dto.ts
import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIrsDto {
  @ApiProperty({
    example: 1,
    description: 'ID Mata Kuliah yang akan didaftarkan di IRS',
    type: Number,
  })
  @IsNotEmpty({ message: 'ID Mata Kuliah tidak boleh kosong' })
  @IsInt({ message: 'ID Mata Kuliah harus berupa angka' })
  courseId: number;
}
