CREATE TABLE "timed_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"score" integer NOT NULL,
	"mistakes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"selected_groups" text[] NOT NULL,
	"sharps_filter" text NOT NULL,
	"hands_mode" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" integer PRIMARY KEY DEFAULT 0 NOT NULL,
	"num_keys" integer DEFAULT 88 NOT NULL,
	"show_notes" boolean DEFAULT false NOT NULL,
	"selected_groups" text[] DEFAULT '{"Major"}' NOT NULL,
	"sharps_filter" text DEFAULT 'with-sharps' NOT NULL,
	"hands_mode" text DEFAULT 'right' NOT NULL,
	"octave_offset_right" integer DEFAULT 0 NOT NULL,
	"octave_offset_left" integer DEFAULT 0 NOT NULL
);
