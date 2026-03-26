CREATE TABLE "course_grading_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"weight" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"component_id" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "is_grades_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_grading_components" ADD CONSTRAINT "course_grading_components_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_component_id_course_grading_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."course_grading_components"("id") ON DELETE cascade ON UPDATE no action;