import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CoursesModule } from './courses/courses.module';
import { IrsModule } from './irs/irs.module';
import { GradesModule } from './grades/grades.module';
import { RhsModule } from './rhs/rhs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    IrsModule,
    GradesModule,
    RhsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
