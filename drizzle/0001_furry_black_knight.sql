ALTER TABLE "users" ADD COLUMN "name" varchar(255) DEFAULT 'Pengguna Sistem' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "npm" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nip" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_npm_unique" UNIQUE("npm");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_nip_unique" UNIQUE("nip");