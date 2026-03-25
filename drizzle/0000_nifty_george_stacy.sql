CREATE TYPE "public"."role" AS ENUM('DOSEN', 'MAHASISWA');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"credits" integer NOT NULL,
	"capacity" integer DEFAULT 40 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "student_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_enrollment" UNIQUE("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'MAHASISWA' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;