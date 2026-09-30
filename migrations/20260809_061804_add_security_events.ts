import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "security_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"endpoint" varchar NOT NULL,
  	"identifier" varchar NOT NULL,
  	"blocked" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "security_events_id" integer;
  CREATE INDEX "security_events_endpoint_idx" ON "security_events" USING btree ("endpoint");
  CREATE INDEX "security_events_identifier_idx" ON "security_events" USING btree ("identifier");
  CREATE INDEX "security_events_blocked_idx" ON "security_events" USING btree ("blocked");
  CREATE INDEX "security_events_updated_at_idx" ON "security_events" USING btree ("updated_at");
  CREATE INDEX "security_events_created_at_idx" ON "security_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_security_events_fk" FOREIGN KEY ("security_events_id") REFERENCES "public"."security_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_security_events_id_idx" ON "payload_locked_documents_rels" USING btree ("security_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "security_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "security_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_security_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_security_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "security_events_id";`)
}
