// src/grades/grades.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';

// Menggunakan DTO dari folder courses untuk sementara waktu agar tidak error
import { SetGradingComponentsDto } from './grading.dto';
import { BatchInputGradesDto } from './input-grades.dto';

@Injectable()
export class GradesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==========================================
  // FITUR 1: KOMPONEN PENILAIAN (UTS, UAS, dll)
  // ==========================================
  async getGradingComponents(courseId: number) {
    return await this.db
      .select()
      .from(schema.courseGradingComponents)
      .where(eq(schema.courseGradingComponents.courseId, courseId));
  }

  async setGradingComponents(courseId: number, dto: SetGradingComponentsDto) {
    const totalWeight = dto.components.reduce(
      (sum, comp) => sum + comp.weight,
      0,
    );
    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Total bobot harus tepat 100%. Saat ini total bobot Anda: ${totalWeight}%`,
      );
    }

    return await this.db.transaction(async (tx) => {
      const course = await tx
        .select()
        .from(schema.courses)
        .where(eq(schema.courses.id, courseId));
      if (course.length === 0)
        throw new NotFoundException('Mata kuliah tidak ditemukan');

      await tx
        .delete(schema.courseGradingComponents)
        .where(eq(schema.courseGradingComponents.courseId, courseId));

      const insertData = dto.components.map((c) => ({
        courseId,
        name: c.name,
        weight: c.weight,
      }));

      await tx.insert(schema.courseGradingComponents).values(insertData);

      return {
        message: 'Komposisi nilai berhasil disimpan!',
        totalWeight,
      };
    });
  }

  // ==========================================
  // FITUR 2: INPUT NILAI MENTAH MAHASISWA
  // ==========================================
  async getCourseGrades(courseId: number) {
    return await this.db
      .select({
        studentId: schema.studentGrades.studentId,
        componentId: schema.studentGrades.componentId,
        score: schema.studentGrades.score,
      })
      .from(schema.studentGrades)
      .where(eq(schema.studentGrades.courseId, courseId));
  }

  async inputStudentGrades(courseId: number, dto: BatchInputGradesDto) {
    return await this.db.transaction(async (tx) => {
      for (const grade of dto.grades) {
        await tx
          .delete(schema.studentGrades)
          .where(
            and(
              eq(schema.studentGrades.studentId, grade.studentId),
              eq(schema.studentGrades.componentId, grade.componentId),
            ),
          );

        await tx.insert(schema.studentGrades).values({
          courseId,
          studentId: grade.studentId,
          componentId: grade.componentId,
          score: grade.score.toString(),
        });
      }

      return { message: `${dto.grades.length} data nilai berhasil disimpan!` };
    });
  }

  // ==========================================
  // FITUR 3: PUBLIKASI NILAI
  // ==========================================
  async toggleGradePublication(courseId: number, isPublished: boolean) {
    const [updatedCourse] = await this.db
      .update(schema.courses)
      .set({ isGradesPublished: isPublished })
      .where(eq(schema.courses.id, courseId))
      .returning();

    if (!updatedCourse)
      throw new NotFoundException('Mata kuliah tidak ditemukan');

    const status = isPublished ? 'DIPUBLIKASIKAN' : 'DISEMBUNYIKAN';
    return {
      message: `Nilai mata kuliah ${updatedCourse.name} sekarang ${status}.`,
    };
  }
}
