// src/rhs/rhs.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database.module'; // Sesuaikan path jika berbeda
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

export interface RHSDetail {
  courseId: number;
  code: string;
  name: string;
  credits: number;
  isPublished: boolean;
  finalScore: number | null;
  letter: string;
  index: number;
  status: string;
}

@Injectable()
export class RhsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==========================================
  // HELPER: KONVERSI NILAI PRESISI
  // ==========================================
  private getGradeInfo(finalScore: number) {
    if (finalScore >= 85) return { letter: 'A', index: 4.0 };
    if (finalScore >= 80) return { letter: 'A-', index: 3.7 };
    if (finalScore >= 75) return { letter: 'B+', index: 3.3 };
    if (finalScore >= 70) return { letter: 'B', index: 3.0 };
    if (finalScore >= 65) return { letter: 'B-', index: 2.7 };
    if (finalScore >= 60) return { letter: 'C+', index: 2.3 };
    if (finalScore >= 55) return { letter: 'C', index: 2.0 };
    if (finalScore >= 40) return { letter: 'D', index: 1.0 };
    return { letter: 'E', index: 0.0 };
  }

  // ==========================================
  // FITUR UTAMA: KALKULASI RHS & IP SEMESTER
  // ==========================================
  async getStudentRHS(studentId: number) {
    // 1. Tarik mata kuliah yang diambil
    const enrolledCourses = await this.db
      .select({
        courseId: schema.courses.id,
        code: schema.courses.code,
        name: schema.courses.name,
        credits: schema.courses.credits,
        isPublished: schema.courses.isGradesPublished,
      })
      .from(schema.studentCourses)
      .innerJoin(
        schema.courses,
        eq(schema.studentCourses.courseId, schema.courses.id),
      )
      .where(eq(schema.studentCourses.studentId, studentId));

    // 2. Tarik nilai mentah
    const studentScores = await this.db
      .select({
        courseId: schema.studentGrades.courseId,
        weight: schema.courseGradingComponents.weight,
        score: schema.studentGrades.score,
      })
      .from(schema.studentGrades)
      .innerJoin(
        schema.courseGradingComponents,
        eq(schema.studentGrades.componentId, schema.courseGradingComponents.id),
      )
      .where(eq(schema.studentGrades.studentId, studentId));

    let totalSks = 0;
    let totalBobotSks = 0;
    const rhsDetails: RHSDetail[] = [];

    // 3. Kalkulasi per Matkul
    for (const course of enrolledCourses) {
      const courseScores = studentScores.filter(
        (s) => s.courseId === course.courseId,
      );
      const hasGrades = courseScores.length > 0;

      if (!course.isPublished) {
        const statusText = hasGrades ? 'Menunggu Publikasi' : 'Belum Dinilai';
        rhsDetails.push({
          ...course,
          finalScore: null,
          letter: '-',
          index: 0.0,
          status: statusText,
        });
        continue;
      }

      // Kalkulasi jika sudah rilis
      let finalScore = 0;
      courseScores.forEach((s) => {
        finalScore += (Number(s.score) * s.weight) / 100;
      });

      const { letter, index } = this.getGradeInfo(finalScore);

      rhsDetails.push({
        ...course,
        finalScore: parseFloat(finalScore.toFixed(2)),
        letter,
        index,
        status: 'Rilis',
      });

      totalSks += course.credits;
      totalBobotSks += course.credits * index;
    }

    // 4. Finalisasi IP Semester
    const ipSemester =
      totalSks > 0 ? (totalBobotSks / totalSks).toFixed(2) : '0.00';

    return {
      studentId,
      ipSemester: parseFloat(ipSemester),
      totalSksEvaluated: totalSks,
      details: rhsDetails,
    };
  }
}
