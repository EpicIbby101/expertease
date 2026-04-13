CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"max_trainees" integer DEFAULT 10,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"deleted_by" text,
	"deleted_reason" text,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"email" varchar NOT NULL,
	"first_name" text,
	"last_name" text,
	"gender" text,
	"profile_image_url" text,
	"user_id" varchar NOT NULL,
	"subscription" text,
	"company_id" uuid,
	"company_name" text,
	"role" text DEFAULT 'trainee',
	"phone" text,
	"job_title" text,
	"department" text,
	"is_active" boolean DEFAULT true,
	"profile_completed" boolean DEFAULT false,
	"bio" text,
	"location" text,
	"timezone" text,
	"preferred_language" text DEFAULT 'en',
	"last_active_at" timestamp,
	"email_verified" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"company_id" uuid,
	"invited_by" varchar NOT NULL,
	"status" text DEFAULT 'pending',
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_data" jsonb,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"stripe_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"amount" varchar NOT NULL,
	"payment_time" varchar NOT NULL,
	"payment_date" varchar NOT NULL,
	"currency" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"customer_details" text NOT NULL,
	"payment_intent" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"subscription_id" varchar NOT NULL,
	"stripe_user_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"start_date" varchar NOT NULL,
	"end_date" varchar,
	"plan_id" varchar NOT NULL,
	"default_payment_method_id" varchar,
	"email" varchar NOT NULL,
	"user_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"plan_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"amount" varchar NOT NULL,
	"currency" varchar NOT NULL,
	"interval" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"invoice_id" varchar NOT NULL,
	"subscription_id" varchar NOT NULL,
	"amount_paid" varchar NOT NULL,
	"amount_due" varchar,
	"currency" varchar NOT NULL,
	"status" varchar NOT NULL,
	"email" varchar NOT NULL,
	"user_id" varchar
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"payment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"refund_id" varchar NOT NULL,
	"amount" varchar NOT NULL,
	"currency" varchar NOT NULL,
	"refund_date" timestamp NOT NULL,
	"status" varchar NOT NULL,
	"reason" text,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;